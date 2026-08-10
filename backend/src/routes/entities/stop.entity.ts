// ─── Entity: Stop ────────────────────────────────────────────────────────────
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Route } from './route.entity';

@Entity('stops')
export class Stop {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'route_id' })
  routeId: string;

  @ManyToOne(() => Route, (r) => r.stops, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'route_id' })
  route: Route;

  @Column({ name: 'stop_name' })
  stopName: string;

  @Column({ name: 'stop_name_ta', nullable: true })
  stopNameTa: string;

  @Column({ name: 'sequence_num' })
  sequenceNum: number;

  @Column({ type: 'float8' })
  latitude: number;

  @Column({ type: 'float8' })
  longitude: number;

  @Column({ name: 'scheduled_time', nullable: true, type: 'time' })
  scheduledTime: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
