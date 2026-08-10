import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Route } from './entities/route.entity';
import { Stop } from './entities/stop.entity';
import { ChatRoomMember } from '../chat/entities/chat-room-member.entity';
import { RoutesService } from './routes.service';
import { RoutesController } from './routes.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([Route, Stop, ChatRoomMember]), AuditModule],
  providers: [RoutesService],
  controllers: [RoutesController],
  exports: [RoutesService],
})
export class RoutesModule {}
