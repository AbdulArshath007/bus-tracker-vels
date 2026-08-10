// ─── Entity: Bus ─────────────────────────────────────────────────────────────
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { BusAssignment } from './bus-assignment.entity';
import { Ride } from '../../rides/entities/ride.entity';
import { GpsPing } from '../../rides/entities/gps-ping.entity';

@Entity('buses')
export class Bus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'bus_number', unique: true })
  busNumber: string;

  @Column({ name: 'plate_number', unique: true })
  plateNumber: string;

  @Column({ default: 60 })
  capacity: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => BusAssignment, (a) => a.bus)
  assignments: BusAssignment[];

  @OneToMany(() => Ride, (r) => r.bus)
  rides: Ride[];

  @OneToMany(() => GpsPing, (g) => g.bus)
  gpsPings: GpsPing[];
}
