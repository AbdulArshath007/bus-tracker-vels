import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GpsGateway } from './gps.gateway';
import { User } from '../users/entities/user.entity';
import { Ride } from '../rides/entities/ride.entity';
import { GpsPing } from '../rides/entities/gps-ping.entity';
import { ChatRoomMember } from '../chat/entities/chat-room-member.entity';
import { RidesModule } from '../rides/rides.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Ride, GpsPing, ChatRoomMember]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (cs: ConfigService) => ({
        secret: cs.get<string>('jwt.secret'),
      }),
      inject: [ConfigService],
    }),
    RidesModule,
    ChatModule,
  ],
  providers: [GpsGateway],
  exports: [GpsGateway],
})
export class GpsModule {}
