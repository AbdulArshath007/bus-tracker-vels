import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { NotificationLog } from './entities/notification-log.entity';
import { ChatRoomMember } from '../chat/entities/chat-room-member.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsLogController } from './notifications-log.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, NotificationLog, ChatRoomMember])],
  providers: [NotificationsService],
  controllers: [NotificationsController, NotificationsLogController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
