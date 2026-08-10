// ─── Entity: ChatRoomMember ───────────────────────────────────────────────────
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ChatRoom } from './chat-room.entity';
import { User } from '../../users/entities/user.entity';

export type RoleInRoom = 'student' | 'driver' | 'admin';

@Entity('chat_room_members')
// Enforce: a student can only be in one room (partial unique at DB level handled via migration)
export class ChatRoomMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'room_id' })
  roomId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Index()
  @ManyToOne(() => ChatRoom, (r) => r.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: ChatRoom;

  @ManyToOne(() => User, (u) => u.chatRoomMemberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'role_in_room', type: 'text' })
  roleInRoom: RoleInRoom;

  @CreateDateColumn({ name: 'added_at' })
  addedAt: Date;
}
