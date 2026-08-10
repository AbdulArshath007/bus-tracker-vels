// ─── Entity: Message ─────────────────────────────────────────────────────────
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ChatRoom } from './chat-room.entity';
import { User } from '../../users/entities/user.entity';
import { Attachment } from './attachment.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'room_id' })
  roomId: string;

  @Column({ name: 'sender_id' })
  senderId: string;

  @Index()
  @ManyToOne(() => ChatRoom, (r) => r.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: ChatRoom;

  @ManyToOne(() => User, (u) => u.messages, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @Column({ nullable: true, type: 'text' })
  content: string;

  @Column({ name: 'is_deleted', default: false })
  isDeleted: boolean;

  @Column({ name: 'deleted_by', nullable: true })
  deletedBy: string;

  @Column({ name: 'deleted_at', nullable: true, type: 'timestamptz' })
  deletedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => Attachment, (a) => a.message, { eager: true })
  attachments: Attachment[];
}
