import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ride } from './entities/ride.entity';
import { GpsPing } from './entities/gps-ping.entity';
import { Bus } from '../buses/entities/bus.entity';
import { BusAssignment } from '../buses/entities/bus-assignment.entity';
import { RidesService } from './rides.service';
import { RidesController } from './rides.controller';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ride, GpsPing, Bus, BusAssignment]),
    AuditModule,
    NotificationsModule,
  ],
  providers: [RidesService],
  controllers: [RidesController],
  exports: [RidesService],
})
export class RidesModule {}
