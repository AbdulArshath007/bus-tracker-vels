// ─── Entity: NotificationLog ─────────────────────────────────────────────────
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('notifications_log')
export class NotificationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'recipient_id' })
  recipientId: string;

  @Index()
  @ManyToOne(() => User, (u) => u.notificationLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipient_id' })
  recipient: User;

  @Column({ name: 'trigger_event' })
  triggerEvent: string;

  @Column()
  title: string;

  @Column()
  body: string;

  @CreateDateColumn({ name: 'sent_at' })
  sentAt: Date;

  @Column({ name: 'fcm_message_id', nullable: true })
  fcmMessageId: string;

  @Column({ type: 'text' })
  status: 'sent' | 'failed';
}
