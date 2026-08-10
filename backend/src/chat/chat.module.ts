import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatRoom } from './entities/chat-room.entity';
import { ChatRoomMember } from './entities/chat-room-member.entity';
import { Message } from './entities/message.entity';
import { Attachment } from './entities/attachment.entity';
import { ScheduledJobLog } from '../common/entities/scheduled-job-log.entity';
import { ChatService } from './chat.service';
import { ChatController, MessagesController } from './chat.controller';
import { AuditModule } from '../audit/audit.module';
import { S3Module } from '../common/s3/s3.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatRoom, ChatRoomMember, Message, Attachment, ScheduledJobLog]),
    AuditModule,
    S3Module,
  ],
  providers: [ChatService],
  controllers: [ChatController, MessagesController],
  exports: [ChatService, TypeOrmModule],
})
export class ChatModule {}
