// ─── Entity: Ride ────────────────────────────────────────────────────────────
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
import { Bus } from '../../buses/entities/bus.entity';
import { User } from '../../users/entities/user.entity';
import { Route } from '../../routes/entities/route.entity';
import { GpsPing } from './gps-ping.entity';

export type RideStatus =
  | 'not_started'
  | 'active'
  | 'destination_reached'
  | 'ended';

@Entity('rides')
export class Ride {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'bus_id' })
  busId: string;

  @Column({ name: 'driver_id' })
  driverId: string;

  @Column({ name: 'route_id' })
  routeId: string;

  @Index()
  @Column({ type: 'text', default: 'not_started' })
  status: RideStatus;

  @Column({ name: 'started_at', nullable: true, type: 'timestamptz' })
  startedAt: Date;

  @Column({
    name: 'destination_reached_at',
    nullable: true,
    type: 'timestamptz',
  })
  destinationReachedAt: Date;

  @Column({ name: 'ended_at', nullable: true, type: 'timestamptz' })
  endedAt: Date;

  @ManyToOne(() => Bus, (b) => b.rides, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'bus_id' })
  bus: Bus;

  @ManyToOne(() => User, (u) => u.rides, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'driver_id' })
  driver: User;

  @ManyToOne(() => Route, (r) => r.rides, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'route_id' })
  route: Route;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => GpsPing, (g) => g.ride)
  gpsPings: GpsPing[];
}
