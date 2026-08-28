// ─── App Module ───────────────────────────────────────────────────────────────
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

// Config
import {
  appConfig, dbConfig, redisConfig, jwtConfig,
  s3Config, fcmConfig, throttleConfig, geoConfig, seedConfig,
} from './config/configuration';

// Entities
import { User } from './users/entities/user.entity';
import { Bus } from './buses/entities/bus.entity';
import { BusAssignment } from './buses/entities/bus-assignment.entity';
import { Route } from './routes/entities/route.entity';
import { Stop } from './routes/entities/stop.entity';
import { ChatRoom } from './chat/entities/chat-room.entity';
import { ChatRoomMember } from './chat/entities/chat-room-member.entity';
import { Message } from './chat/entities/message.entity';
import { Attachment } from './chat/entities/attachment.entity';
import { Ride } from './rides/entities/ride.entity';
import { GpsPing } from './rides/entities/gps-ping.entity';
import { RefreshToken } from './auth/entities/refresh-token.entity';
import { NotificationLog } from './notifications/entities/notification-log.entity';
import { AuditLog } from './audit/entities/audit-log.entity';
import { ScheduledJobLog } from './common/entities/scheduled-job-log.entity';

// Modules
import { RedisModule } from './common/redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { UsersModule } from './users/users.module';
import { BusesModule } from './buses/buses.module';
import { RoutesModule } from './routes/routes.module';
import { RidesModule } from './rides/rides.module';
import { ChatModule } from './chat/chat.module';
import { GpsModule } from './gps/gps.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // ── Config ──────────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig, dbConfig, redisConfig, jwtConfig,
        s3Config, fcmConfig, throttleConfig, geoConfig, seedConfig,
      ],
      envFilePath: '.env',
    }),

    // ── Database ─────────────────────────────────────────────────────────
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (cs: ConfigService) => ({
        type: 'postgres',
        host: cs.get<string>('db.host'),
        port: cs.get<number>('db.port'),
        database: cs.get<string>('db.name'),
        username: cs.get<string>('db.user'),
        password: cs.get<string>('db.password'),
        entities: [
          User, Bus, BusAssignment, Route, Stop,
          ChatRoom, ChatRoomMember, Message, Attachment,
          Ride, GpsPing, RefreshToken,
          NotificationLog, AuditLog, ScheduledJobLog,
        ],
        migrations: ['dist/database/migrations/*.js'],
        migrationsRun: true, // Auto-run migrations on startup
        synchronize: process.env.TYPEORM_SYNC === 'true',
        logging: cs.get<string>('app.nodeEnv') === 'development',
        ssl: cs.get<string>('app.nodeEnv') === 'production'
          ? { rejectUnauthorized: false }
          : false,
      }),
      inject: [ConfigService],
    }),

    // ── Rate limiting ─────────────────────────────────────────────────────
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (cs: ConfigService) => ({
        throttlers: [
          {
            name: 'global',
            ttl: cs.get<number>('throttle.globalTtlMs') || 60000,
            limit: cs.get<number>('throttle.globalLimit') || 200,
          },
          {
            name: 'auth',
            ttl: cs.get<number>('throttle.authTtlMs') || 900000,
            limit: cs.get<number>('throttle.authLimit') || 10,
          },
        ],
      }),
      inject: [ConfigService],
    }),

    // ── Scheduled jobs ───────────────────────────────────────────────────
    ScheduleModule.forRoot(),

    // ── Feature modules ──────────────────────────────────────────────────
    RedisModule,
    AuthModule,
    AuditModule,
    UsersModule,
    BusesModule,
    RoutesModule,
    RidesModule,
    GpsModule,
    ChatModule,
    NotificationsModule,
    SchedulerModule,
    HealthModule,
  ],
  providers: [
    // Global throttler guard — all endpoints rate-limited by default
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Global validation pipe
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,       // strip unknown properties
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    },
  ],
})
export class AppModule {}
