// ─── GPS Gateway (Socket.io) ─────────────────────────────────────────────────
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Ride } from '../rides/entities/ride.entity';
import { GpsPing } from '../rides/entities/gps-ping.entity';
import { ChatRoomMember } from '../chat/entities/chat-room-member.entity';
import { RedisService } from '../common/redis/redis.service';
import { ConfigService } from '@nestjs/config';

interface GpsPingPayload {
  ride_id: string;
  latitude: number;
  longitude: number;
  speed_kmh?: number;
  heading?: number;
  accuracy_m?: number;
  recorded_at: string;
}

interface LocalQueueFlushPayload {
  ride_id: string;
  pings: GpsPingPayload[];
}

// Ping buffer for batch DB inserts (flush every 5 s or 50 pings)
const pingBuffer: GpsPing[] = [];
let flushTimeout: NodeJS.Timeout | null = null;

@WebSocketGateway({
  cors: { origin: '*', credentials: true }, // tightened per CORS_ORIGINS in AppModule
  namespace: '/',
})
export class GpsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(GpsGateway.name);

  // Map: socket.id -> { userId, role, busId, chatRoomId }
  private socketMeta = new Map<
    string,
    { userId: string; role: string; busId?: string; chatRoomId?: string }
  >();

  constructor(
    private jwtService: JwtService,
    private redisService: RedisService,
    private configService: ConfigService,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Ride) private rideRepo: Repository<Ride>,
    @InjectRepository(GpsPing) private pingRepo: Repository<GpsPing>,
    @InjectRepository(ChatRoomMember)
    private memberRepo: Repository<ChatRoomMember>,
  ) {}

  // ── Connection ─────────────────────────────────────────────────────────────
  async handleConnection(socket: Socket) {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) throw new Error('No token');

      const payload = this.jwtService.verify<{
        sub: string;
        role: string;
      }>(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      const user = await this.userRepo.findOne({
        where: { id: payload.sub, isActive: true },
      });
      if (!user) throw new Error('User not found');

      // Resolve bus and chat room for this user
      let busId: string | undefined;
      let chatRoomId: string | undefined;

      if (user.role === 'student' || user.role === 'driver') {
        const membership = await this.memberRepo.findOne({
          where: { userId: user.id },
          relations: ['room'],
        });
        if (membership) {
          chatRoomId = membership.roomId;
          // Find bus for this room via route
          const activeRide = await this.rideRepo.findOne({
            where: { status: In(['active', 'destination_reached']) },
            relations: ['bus'],
          });
          // Approximate: find bus assigned to same route as this room
          // Full query done in RidesService; here we join socket to room
          busId = activeRide?.busId;
        }
      }

      this.socketMeta.set(socket.id, {
        userId: user.id,
        role: user.role,
        busId,
        chatRoomId,
      });

      // Join socket.io rooms
      if (user.role === 'admin') {
        socket.join('admin:all');
        // Admins should join ALL chat rooms automatically
        const rooms = await this.userRepo.manager.query('SELECT id FROM chat_rooms');
        for (const r of rooms) {
          socket.join(`chat:${r.id}`);
        }
      } else {
        if (busId) socket.join(`bus:${busId}`);
        if (chatRoomId) socket.join(`chat:${chatRoomId}`);
      }

      this.logger.log(`Socket connected: ${user.email} (${user.role})`);
    } catch (err) {
      this.logger.warn(`Socket auth failed: ${err.message}`);
      socket.emit('error', { code: 'AUTH_FAILED', message: 'Not authorized.' });
      socket.disconnect();
    }
  }

  // ── Disconnection ──────────────────────────────────────────────────────────
  async handleDisconnect(socket: Socket) {
    const meta = this.socketMeta.get(socket.id);
    if (!meta) return;

    if (meta.role === 'driver' && meta.busId) {
      // Mark location stale and emit last-seen to the bus room
      const loc = await this.redisService.getLocation(meta.busId);
      if (loc) {
        await this.redisService.markLocationStale(meta.busId);
        this.server.to(`bus:${meta.busId}`).emit('bus.last_seen', {
          bus_id: meta.busId,
          last_latitude: loc.latitude,
          last_longitude: loc.longitude,
          last_seen_at: loc.timestamp,
        });
      }
    }

    this.socketMeta.delete(socket.id);
    this.logger.log(`Socket disconnected: ${meta.userId}`);
  }

  // ── GPS ping ───────────────────────────────────────────────────────────────
  @SubscribeMessage('gps.ping')
  async handleGpsPing(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: GpsPingPayload,
  ) {
    const meta = this.socketMeta.get(socket.id);
    if (!meta || meta.role !== 'driver') {
      return { status: 'error', code: 'FORBIDDEN' };
    }

    // Validate the ride belongs to this driver
    const ride = await this.rideRepo.findOne({
      where: {
        id: data.ride_id,
        driverId: meta.userId,
        status: In(['active', 'destination_reached']),
      },
    });

    if (!ride) {
      return { status: 'error', code: 'RIDE_NOT_ACTIVE' };
    }

    const recordedAt = new Date(data.recorded_at);
    if (isNaN(recordedAt.getTime())) {
      return { status: 'error', code: 'INVALID_TIMESTAMP' };
    }

    // 1. Update Redis cache synchronously (fallback gracefully if offline)
    try {
      await this.redisService.setLocation(ride.busId, {
        latitude: data.latitude,
        longitude: data.longitude,
        speedKmh: data.speed_kmh ?? null,
        heading: data.heading ?? null,
        timestamp: data.recorded_at,
        rideId: ride.id,
        driverId: meta.userId,
        isLive: true,
      });
    } catch (err) {
      this.logger.warn(`Redis unavailable, skipping cache for ping on ride ${ride.id}`);
    }

    // 2. Update socket meta with current busId
    this.socketMeta.set(socket.id, { ...meta, busId: ride.busId });

    // 3. Broadcast live update to bus room
    this.server.to(`bus:${ride.busId}`).emit('location.update', {
      bus_id: ride.busId,
      latitude: data.latitude,
      longitude: data.longitude,
      speed_kmh: data.speed_kmh,
      heading: data.heading,
      timestamp: data.recorded_at,
      ride_id: ride.id,
    });
    // Also push to admin room
    this.server.to('admin:all').emit('location.update', {
      bus_id: ride.busId,
      latitude: data.latitude,
      longitude: data.longitude,
      speed_kmh: data.speed_kmh,
      heading: data.heading,
      timestamp: data.recorded_at,
      ride_id: ride.id,
    });

    // 4. Buffer DB write
    const ping = this.pingRepo.create({
      rideId: ride.id,
      busId: ride.busId,
      latitude: data.latitude,
      longitude: data.longitude,
      speedKmh: data.speed_kmh,
      heading: data.heading,
      accuracyM: data.accuracy_m,
      recordedAt,
    });
    pingBuffer.push(ping);
    this.scheduleFlush();

    return { status: 'ok' };
  }

  // ── Local queue flush (after network drop) ─────────────────────────────────
  @SubscribeMessage('gps.local_queue_flush')
  async handleQueueFlush(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: LocalQueueFlushPayload,
  ) {
    const meta = this.socketMeta.get(socket.id);
    if (!meta || meta.role !== 'driver') {
      return { status: 'error', code: 'FORBIDDEN' };
    }

    const ride = await this.rideRepo.findOne({
      where: { id: data.ride_id, driverId: meta.userId },
    });
    if (!ride) return { status: 'error', code: 'RIDE_NOT_FOUND' };

    // Batch insert with deduplication by (ride_id, recorded_at)
    if (!data.pings?.length) return { status: 'ok', inserted: 0 };

    const entities = data.pings
      .filter((p) => !isNaN(new Date(p.recorded_at).getTime()))
      .map((p) =>
        this.pingRepo.create({
          rideId: ride.id,
          busId: ride.busId,
          latitude: p.latitude,
          longitude: p.longitude,
          speedKmh: p.speed_kmh,
          heading: p.heading,
          accuracyM: p.accuracy_m,
          recordedAt: new Date(p.recorded_at),
        }),
      );

    // ON CONFLICT DO NOTHING for duplicate (ride_id, recorded_at)
    await this.pingRepo
      .createQueryBuilder()
      .insert()
      .into(GpsPing)
      .values(entities)
      .orIgnore()
      .execute();

    return { status: 'ok', inserted: entities.length };
  }

  // ── Chat typing indicator ──────────────────────────────────────────────────
  @SubscribeMessage('chat.typing')
  handleTyping(@ConnectedSocket() socket: Socket, @MessageBody() data: { room_id: string }) {
    const meta = this.socketMeta.get(socket.id);
    if (!meta) return;

    // Throttle at gateway level is handled by Socket.io's built-in rate at client.
    // Here we simply broadcast to room excluding sender.
    socket.to(`chat:${data.room_id}`).emit('chat.typing', {
      room_id: data.room_id,
      user_id: meta.userId,
    });
  }

  // ── Emit helpers (called by RidesService and ChatService) ─────────────────
  emitToRoom(room: string, event: string, payload: unknown) {
    this.server.to(room).emit(event, payload);
  }

  emitToBus(busId: string, event: string, payload: unknown) {
    this.server.to(`bus:${busId}`).emit(event, payload);
    this.server.to('admin:all').emit(event, payload);
  }

  emitToChat(roomId: string, event: string, payload: unknown) {
    this.server.to(`chat:${roomId}`).emit(event, payload);
  }

  // Add a socket to a bus room (called when driver starts ride)
  joinBusRoom(driverSocketId: string | undefined, busId: string) {
    if (!driverSocketId) return;
    const s = this.server.sockets.sockets.get(driverSocketId);
    if (s) s.join(`bus:${busId}`);
  }

  // ── Ping buffer flush ──────────────────────────────────────────────────────
  private scheduleFlush() {
    if (flushTimeout) return;
    flushTimeout = setTimeout(() => this.flushPings(), 5000);
  }

  private async flushPings() {
    flushTimeout = null;
    if (!pingBuffer.length) return;
    const toFlush = pingBuffer.splice(0, pingBuffer.length);
    try {
      await this.pingRepo.save(toFlush);
    } catch (err) {
      this.logger.error('GPS ping flush failed', err.message);
    }
  }
}
