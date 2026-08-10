import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { NotificationLog } from '../notifications/entities/notification-log.entity';
import { ScheduledJobLog } from '../common/entities/scheduled-job-log.entity';
import { Route } from '../routes/entities/route.entity';
import { Stop } from '../routes/entities/stop.entity';
import { SchedulerService } from './scheduler.service';
import { ChatModule } from '../chat/chat.module';
import { RidesModule } from '../rides/rides.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLog, NotificationLog, ScheduledJobLog, Route, Stop]),
    ChatModule,
    RidesModule,
    AuditModule,
    NotificationsModule,
  ],
  providers: [SchedulerService],
})
export class SchedulerModule {}
