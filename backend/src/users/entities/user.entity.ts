// ─── Entity: User ────────────────────────────────────────────────────────────
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ChatRoomMember } from '../../chat/entities/chat-room-member.entity';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';
import { Message } from '../../chat/entities/message.entity';
import { Attachment } from '../../chat/entities/attachment.entity';
import { Ride } from '../../rides/entities/ride.entity';
import { NotificationLog } from '../../notifications/entities/notification-log.entity';

export type UserRole = 'student' | 'driver' | 'admin';
export type LanguagePref = 'en' | 'ta';
export type ThemePref = 'light' | 'dark';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'text' })
  role: UserRole;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ name: 'language_pref', default: 'en' })
  languagePref: LanguagePref;

  @Column({ name: 'theme_pref', default: 'light' })
  themePref: ThemePref;

  @Column({ name: 'fcm_token', nullable: true })
  fcmToken: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => RefreshToken, (rt) => rt.user)
  refreshTokens: RefreshToken[];

  @OneToMany(() => ChatRoomMember, (m) => m.user)
  chatRoomMemberships: ChatRoomMember[];

  @OneToMany(() => Message, (msg) => msg.sender)
  messages: Message[];

  @OneToMany(() => Attachment, (a) => a.uploader)
  attachments: Attachment[];

  @OneToMany(() => Ride, (r) => r.driver)
  rides: Ride[];

  @OneToMany(() => NotificationLog, (n) => n.recipient)
  notificationLogs: NotificationLog[];
}
