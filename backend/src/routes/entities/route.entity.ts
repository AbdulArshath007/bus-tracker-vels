// ─── Entity: Route ────────────────────────────────────────────────────────────
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Stop } from './stop.entity';
import { BusAssignment } from '../../buses/entities/bus-assignment.entity';
import { ChatRoom } from '../../chat/entities/chat-room.entity';
import { Ride } from '../../rides/entities/ride.entity';

@Entity('routes')
export class Route {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'route_name', unique: true })
  routeName: string;

  @Column({ name: 'route_name_ta', nullable: true })
  routeNameTa: string;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Stop, (s) => s.route, { cascade: true, eager: true })
  stops: Stop[];

  @OneToMany(() => BusAssignment, (a) => a.route)
  assignments: BusAssignment[];

  @OneToOne(() => ChatRoom, (room) => room.route)
  chatRoom: ChatRoom;

  @OneToMany(() => Ride, (r) => r.route)
  rides: Ride[];
}
