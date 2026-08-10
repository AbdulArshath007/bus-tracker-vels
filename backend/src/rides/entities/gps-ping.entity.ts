// ─── Entity: GpsPing ─────────────────────────────────────────────────────────
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { Ride } from './ride.entity';
import { Bus } from '../../buses/entities/bus.entity';

@Entity('gps_pings')
@Index(['rideId', 'recordedAt'])
@Index(['busId', 'recordedAt'])
export class GpsPing {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ name: 'ride_id' })
  rideId: string;

  @Column({ name: 'bus_id' })
  busId: string;

  @Column({ type: 'float8' })
  latitude: number;

  @Column({ type: 'float8' })
  longitude: number;

  @Column({ name: 'speed_kmh', type: 'real', nullable: true })
  speedKmh: number;

  @Column({ type: 'real', nullable: true })
  heading: number;

  @Column({ name: 'accuracy_m', type: 'real', nullable: true })
  accuracyM: number;

  @Column({ name: 'recorded_at', type: 'timestamptz' })
  recordedAt: Date;

  @CreateDateColumn({ name: 'received_at' })
  receivedAt: Date;

  @ManyToOne(() => Ride, (r) => r.gpsPings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ride_id' })
  ride: Ride;

  @ManyToOne(() => Bus, (b) => b.gpsPings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bus_id' })
  bus: Bus;
}
