// ─── Chat Service ─────────────────────────────────────────────────────────────
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  GoneException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { ChatRoom } from './entities/chat-room.entity';
import { ChatRoomMember } from './entities/chat-room-member.entity';
import { Message } from './entities/message.entity';
import { Attachment } from './entities/attachment.entity';
import { User } from '../users/entities/user.entity';
import { S3Service } from '../common/s3/s3.service';
import { AuditService } from '../audit/audit.service';
import { ScheduledJobLog } from '../common/entities/scheduled-job-log.entity';
import { ConfigService } from '@nestjs/config';

// GpsGateway injected lazily
let _gateway: any;
export function setChatGateway(g: any) {
  _gateway = g;
}

const ALLOWED_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(ChatRoom) private roomRepo: Repository<ChatRoom>,
    @InjectRepository(ChatRoomMember)
    private memberRepo: Repository<ChatRoomMember>,
    @InjectRepository(Message) private msgRepo: Repository<Message>,
    @InjectRepository(Attachment) private attRepo: Repository<Attachment>,
    @InjectRepository(ScheduledJobLog)
    private jobLogRepo: Repository<ScheduledJobLog>,
    private s3: S3Service,
    private auditService: AuditService,
    private configService: ConfigService,
  ) {}

  // ── Helper: verify user is member of room ─────────────────────────────────
  private async assertMember(roomId: string, userId: string, userRole: string) {
    if (userRole === 'admin') return; // admin has access to all rooms
    const m = await this.memberRepo.findOne({
      where: { roomId, userId },
    });
    if (!m) throw new ForbiddenException('Not authorized.');
  }

  // ── List rooms ────────────────────────────────────────────────────────────
  async listRooms(user: User) {
    if (user.role === 'admin') {
      return this.roomRepo.find({ relations: ['route'] });
    }
    const memberships = await this.memberRepo.find({
      where: { userId: user.id },
      relations: ['room', 'room.route'],
    });
    return memberships.map((m) => m.room);
  }

  // ── Get room detail ───────────────────────────────────────────────────────
  async getRoom(roomId: string, user: User) {
    await this.assertMember(roomId, user.id, user.role);
    const room = await this.roomRepo.findOne({
      where: { id: roomId },
      relations: ['route', 'members', 'members.user'],
    });
    if (!room) throw new NotFoundException('Room not found.');
    return room;
  }

  // ── Get room members ──────────────────────────────────────────────────────
  async getMembers(roomId: string) {
    return this.memberRepo.find({
      where: { roomId },
      relations: ['user'],
    });
  }

  // ── Add member ────────────────────────────────────────────────────────────
  async addMember(roomId: string, userId: string, roleInRoom: string) {
    // For students: remove existing room membership first
    if (roleInRoom === 'student') {
      const existing = await this.memberRepo.findOne({
        where: { userId, roleInRoom: 'student' },
      });
      if (existing) await this.memberRepo.remove(existing);
    }

    const member = this.memberRepo.create({ roomId, userId, roleInRoom: roleInRoom as any });
    return this.memberRepo.save(member);
  }

  // ── Remove member ─────────────────────────────────────────────────────────
  async removeMember(roomId: string, userId: string) {
    const m = await this.memberRepo.findOne({ where: { roomId, userId } });
    if (m) await this.memberRepo.remove(m);
  }

  // ── Send message ──────────────────────────────────────────────────────────
  async sendMessage(
    roomId: string,
    sender: User,
    content: string,
  ): Promise<Message> {
    await this.assertMember(roomId, sender.id, sender.role);

    const msg = this.msgRepo.create({
      roomId,
      senderId: sender.id,
      content,
    });
    await this.msgRepo.save(msg);

    // Broadcast
    _gateway?.emitToChat(roomId, 'chat.message', {
      id: msg.id,
      room_id: roomId,
      sender_id: sender.id,
      sender_name: sender.fullName,
      sender_role: sender.role,
      content,
      attachments: [],
      created_at: msg.createdAt,
    });

    return msg;
  }

  // ── List messages (cursor-based) ──────────────────────────────────────────
  async listMessages(
    roomId: string,
    user: User,
    limit: number,
    cursor?: string,
  ) {
    await this.assertMember(roomId, user.id, user.role);
    limit = Math.min(limit, 100);

    const qb = this.msgRepo
      .createQueryBuilder('m')
      .where('m.room_id = :roomId', { roomId })
      .leftJoinAndSelect('m.sender', 'sender')
      .leftJoinAndSelect('m.attachments', 'attachments')
      .orderBy('m.created_at', 'DESC')
      .take(limit + 1);

    if (cursor) {
      qb.andWhere('m.created_at < :cursor', { cursor });
    }

    const rows = await qb.getMany();
    return { data: rows.slice(0, limit), hasMore: rows.length > limit };
  }

  // ── Upload attachment ─────────────────────────────────────────────────────
  async uploadAttachment(
    roomId: string,
    sender: User,
    file: Express.Multer.File,
    messageContent?: string,
  ): Promise<{ messageId: string; attachment: Attachment }> {
    await this.assertMember(roomId, sender.id, sender.role);

    // Server-side file size cap
    if (file.size > MAX_FILE_BYTES) {
      throw new BadRequestException('File exceeds 25 MB limit.');
    }

    // Server-side MIME type validation using file-type (magic bytes)
    const fileType = (await import('file-type')) as any;
    const detected = await fileType.fileTypeFromBuffer(file.buffer);
    const mimeToUse = detected?.mime ?? file.mimetype;

    if (!ALLOWED_MIMES.has(mimeToUse)) {
      throw new BadRequestException('File type not allowed.');
    }

    // Upload to S3
    const storageKey = await this.s3.upload(
      file.buffer,
      mimeToUse,
      file.originalname,
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Create message + attachment in a transaction
    const msg = this.msgRepo.create({
      roomId,
      senderId: sender.id,
      content: messageContent ?? undefined,
    });
    await this.msgRepo.save(msg);

    const att = this.attRepo.create({
      messageId: msg.id,
      uploaderId: sender.id,
      roomId,
      storageKey,
      fileName: file.originalname,
      mimeType: mimeToUse,
      fileSizeBytes: file.size,
      expiresAt,
    });
    await this.attRepo.save(att);

    // Broadcast
    _gateway?.emitToChat(roomId, 'chat.attachment', {
      message_id: msg.id,
      room_id: roomId,
      sender_id: sender.id,
      sender_name: sender.fullName,
      sender_role: sender.role,
      attachment: {
        id: att.id,
        file_name: att.fileName,
        mime_type: att.mimeType,
        file_size_bytes: att.fileSizeBytes,
        expires_at: att.expiresAt,
      },
      created_at: msg.createdAt,
    });

    return { messageId: msg.id, attachment: att };
  }

  // ── Download URL ──────────────────────────────────────────────────────────
  async getDownloadUrl(
    roomId: string,
    attachmentId: string,
    user: User,
  ): Promise<{ download_url: string; expires_at: Date }> {
    await this.assertMember(roomId, user.id, user.role);

    const att = await this.attRepo.findOne({
      where: { id: attachmentId, roomId },
    });
    if (!att) throw new NotFoundException('Attachment not found.');
    if (att.isPurged) throw new GoneException('Attachment has expired.');

    const url = await this.s3.presign(att.storageKey);
    const ttl = this.configService.get<number>('s3.presignedUrlTtlSeconds') || 300;
    const expiresAt = new Date(Date.now() + ttl * 1000);
    return { download_url: url, expires_at: expiresAt };
  }

  // ── Moderate (admin delete) ───────────────────────────────────────────────
  async deleteMessage(
    messageId: string,
    admin: User,
  ): Promise<void> {
    const msg = await this.msgRepo.findOne({ where: { id: messageId } });
    if (!msg) throw new NotFoundException('Message not found.');

    msg.isDeleted = true;
    msg.deletedBy = admin.id;
    msg.deletedAt = new Date();
    await this.msgRepo.save(msg);

    _gateway?.emitToChat(msg.roomId, 'chat.message_deleted', {
      message_id: msg.id,
      room_id: msg.roomId,
      deleted_at: msg.deletedAt,
    });

    await this.auditService.log({
      actorId: admin.id,
      actorRole: 'admin',
      action: 'message.delete',
      targetType: 'message',
      targetId: messageId,
    });
  }

  // ── 30-day attachment cleanup job ─────────────────────────────────────────
  async runAttachmentCleanup(): Promise<void> {
    const jobLog = this.jobLogRepo.create({ jobName: 'attachment-cleanup' });
    await this.jobLogRepo.save(jobLog);

    let rowsAffected = 0;
    try {
      const expired = await this.attRepo.find({
        where: {
          expiresAt: LessThanOrEqual(new Date()),
          isPurged: false,
        },
        take: 500, // process in batches
      });

      for (const att of expired) {
        try {
          await this.s3.delete(att.storageKey);
          att.isPurged = true;
          await this.attRepo.save(att);
          rowsAffected++;
        } catch (err) {
          this.logger.error(
            `Cleanup failed for attachment ${att.id}: ${err.message}`,
          );
        }
      }

      jobLog.status = 'success';
      jobLog.rowsAffected = rowsAffected;
      jobLog.finishedAt = new Date();
      await this.jobLogRepo.save(jobLog);

      await this.auditService.log({
        actorId: undefined,
        action: 'system.cleanup_attachments',
        metadata: { rowsAffected },
      });

      this.logger.log(`Attachment cleanup: ${rowsAffected} files deleted.`);
    } catch (err) {
      jobLog.status = 'failed';
      jobLog.errorMessage = err.message;
      jobLog.finishedAt = new Date();
      await this.jobLogRepo.save(jobLog);

      await this.auditService.log({
        actorId: undefined,
        action: 'system.cleanup_failed',
        metadata: { job: 'attachment-cleanup', error: err.message },
      });

      this.logger.error(`Attachment cleanup job FAILED: ${err.message}`);
      await this.sendFailureAlert('attachment-cleanup', err.message);
    }
  }

  private async sendFailureAlert(jobName: string, error: string) {
    const webhookUrl = this.configService.get<string>('ALERT_WEBHOOK_URL') ||
      process.env.ALERT_WEBHOOK_URL;
    if (!webhookUrl) return;

    try {
      const { default: fetch } = await import('node-fetch' as any).catch(
        () => ({ default: null }),
      );
      if (!fetch) return;
      await (fetch as any)(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `[BusTrack] Cleanup job "${jobName}" FAILED: ${error}`,
        }),
      });
    } catch {}
  }
}
