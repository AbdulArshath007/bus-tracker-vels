import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bus } from './entities/bus.entity';
import { BusAssignment } from './entities/bus-assignment.entity';
import { Route } from '../routes/entities/route.entity';
import { User } from '../users/entities/user.entity';
import { BusesService } from './buses.service';
import { BusesController } from './buses.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([Bus, BusAssignment, Route, User]), AuditModule],
  providers: [BusesService],
  controllers: [BusesController],
  exports: [BusesService],
})
export class BusesModule {}
