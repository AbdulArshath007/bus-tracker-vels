// ─── Entity: ChatRoom ────────────────────────────────────────────────────────
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Route } from '../../routes/entities/route.entity';
import { ChatRoomMember } from './chat-room-member.entity';
import { Message } from './message.entity';
import { Attachment } from './attachment.entity';

@Entity('chat_rooms')
export class ChatRoom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'route_id', unique: true })
  routeId: string;

  @OneToOne(() => Route, (r) => r.chatRoom, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'route_id' })
  route: Route;

  @Column({ name: 'room_name' })
  roomName: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => ChatRoomMember, (m) => m.room)
  members: ChatRoomMember[];

  @OneToMany(() => Message, (msg) => msg.room)
  messages: Message[];

  @OneToMany(() => Attachment, (a) => a.room)
  attachments: Attachment[];
}
