// ─── Notifications Service ────────────────────────────────────────────────────
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { NotificationLog } from './entities/notification-log.entity';
import { ChatRoomMember } from '../chat/entities/chat-room-member.entity';
import { existsSync } from 'fs';

export interface NotifPayload {
  trigger: string;
  title: string;
  titleTa?: string;
  body: string;
  bodyTa?: string;
  data?: Record<string, string>;
}

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private firebaseApp: admin.app.App;

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(NotificationLog)
    private logRepo: Repository<NotificationLog>,
    @InjectRepository(ChatRoomMember)
    private memberRepo: Repository<ChatRoomMember>,
    private configService: ConfigService,
  ) {}

  onModuleInit() {
    const saPath = this.configService.get<string>('firebase.serviceAccountPath') || '';
    if (!existsSync(saPath)) {
      this.logger.warn(
        `Firebase service account not found at ${saPath}. Push notifications are disabled.`,
      );
      return;
    }

    if (!admin.apps.length) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const serviceAccount = require(saPath);
      this.firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      this.logger.log('Firebase Admin SDK initialized.');
    } else {
      this.firebaseApp = admin.app();
    }
  }

  // ── Send to one user ───────────────────────────────────────────────────────
  async sendToUser(
    user: User,
    payload: NotifPayload,
  ): Promise<void> {
    if (!user.fcmToken || !this.firebaseApp) return;

    const lang = user.languagePref;
    const title = lang === 'ta' && payload.titleTa ? payload.titleTa : payload.title;
    const body = lang === 'ta' && payload.bodyTa ? payload.bodyTa : payload.body;

    try {
      const msgId = await this.firebaseApp.messaging().send({
        token: user.fcmToken,
        notification: { title, body },
        data: payload.data ?? {},
        android: { priority: 'high' },
        apns: { payload: { aps: { sound: 'default' } } },
      });

      await this.logRepo.save(
        this.logRepo.create({
          recipientId: user.id,
          triggerEvent: payload.trigger,
          title,
          body,
          fcmMessageId: msgId,
          status: 'sent',
        }),
      );
    } catch (err) {
      this.logger.error(`FCM send failed for user ${user.id}: ${err.message}`);
      await this.logRepo.save(
        this.logRepo.create({
          recipientId: user.id,
          triggerEvent: payload.trigger,
          title,
          body,
          status: 'failed',
        }),
      );
    }
  }

  // ── Send to all students on a route ───────────────────────────────────────
  async notifyRouteStudents(
    routeId: string,
    payload: NotifPayload,
  ): Promise<void> {
    // Find chat room for this route, then get student members
    const members = await this.memberRepo.find({
      where: { roleInRoom: 'student' },
      relations: ['room', 'user'],
    });

    const routeMembers = members.filter(
      (m) => (m.room as any)?.routeId === routeId,
    );

    for (const m of routeMembers) {
      if (m.user?.fcmToken) {
        await this.sendToUser(m.user, payload);
      }
    }
  }

  // ── Admin announcement ─────────────────────────────────────────────────────
  async sendAnnouncement(
    routeId: string | null,
    payload: NotifPayload,
  ): Promise<number> {
    let users: User[];
    if (routeId) {
      // Students on a specific route
      const members = await this.memberRepo.find({
        where: { roleInRoom: 'student' },
        relations: ['room', 'user'],
      });
      users = members
        .filter((m) => (m.room as any)?.routeId === routeId)
        .map((m) => m.user)
        .filter(Boolean);
    } else {
      // All active students
      users = await this.userRepo.find({
        where: { role: 'student', isActive: true },
      });
    }

    for (const u of users) {
      await this.sendToUser(u, payload);
    }
    return users.length;
  }
}
