// ─── Entity: Attachment ──────────────────────────────────────────────────────
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Message } from './message.entity';
import { User } from '../../users/entities/user.entity';
import { ChatRoom } from './chat-room.entity';

@Entity('attachments')
export class Attachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'message_id' })
  messageId: string;

  @Column({ name: 'uploader_id' })
  uploaderId: string;

  @Column({ name: 'room_id' })
  roomId: string;

  @ManyToOne(() => Message, (m) => m.attachments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'message_id' })
  message: Message;

  @ManyToOne(() => User, (u) => u.attachments, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'uploader_id' })
  uploader: User;

  @ManyToOne(() => ChatRoom, (r) => r.attachments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: ChatRoom;

  @Column({ name: 'storage_key', unique: true })
  storageKey: string;

  @Column({ name: 'file_name' })
  fileName: string;

  @Column({ name: 'mime_type' })
  mimeType: string;

  @Column({ name: 'file_size_bytes', type: 'bigint' })
  fileSizeBytes: number;

  @CreateDateColumn({ name: 'uploaded_at' })
  uploadedAt: Date;

  // expires_at = uploaded_at + 30 days (computed and stored)
  @Index()
  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'is_purged', default: false })
  isPurged: boolean;
}
