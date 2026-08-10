// ─── Entity: BusAssignment ───────────────────────────────────────────────────
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Bus } from './bus.entity';
import { Route } from '../../routes/entities/route.entity';
import { User } from '../../users/entities/user.entity';

@Entity('bus_assignments')
export class BusAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'bus_id' })
  busId: string;

  @Column({ name: 'route_id' })
  routeId: string;

  @Column({ name: 'driver_id' })
  driverId: string;

  @ManyToOne(() => Bus, (b) => b.assignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bus_id' })
  bus: Bus;

  @ManyToOne(() => Route, (r) => r.assignments, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'route_id' })
  route: Route;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'driver_id' })
  driver: User;

  @Column({ name: 'assigned_at', type: 'timestamptz', default: () => 'now()' })
  assignedAt: Date;

  // Only one active assignment per bus enforced at application layer
  @Index()
  @Column({ name: 'is_current', default: true })
  isCurrent: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
