// ─── Redis Service ────────────────────────────────────────────────────────────
import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface LastKnownLocation {
  latitude: number;
  longitude: number;
  speedKmh: number | null;
  heading: number | null;
  timestamp: string;
  rideId: string;
  driverId: string;
  isLive: boolean;
}

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private configService: ConfigService) {
    this.client = new Redis({
      host: configService.get<string>('redis.host'),
      port: configService.get<number>('redis.port'),
      password: configService.get<string>('redis.password') || undefined,
      lazyConnect: false,
      enableOfflineQueue: false,
      retryStrategy: (times) => Math.min(times * 100, 3000),
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis error', err.message);
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  // ── Bus location cache ────────────────────────────────────────────────────
  private busKey(busId: string) {
    return `bus:location:${busId}`;
  }

  async setLocation(
    busId: string,
    loc: LastKnownLocation,
  ): Promise<void> {
    await this.client.set(
      this.busKey(busId),
      JSON.stringify(loc),
      'EX',
      86400, // expire after 24 h of no updates
    );
  }

  async getLocation(busId: string): Promise<LastKnownLocation | null> {
    const raw = await this.client.get(this.busKey(busId));
    return raw ? (JSON.parse(raw) as LastKnownLocation) : null;
  }

  async markLocationStale(busId: string): Promise<void> {
    const raw = await this.client.get(this.busKey(busId));
    if (!raw) return;
    const loc: LastKnownLocation = JSON.parse(raw);
    loc.isLive = false;
    await this.client.set(this.busKey(busId), JSON.stringify(loc), 'EX', 86400);
  }

  async clearLocation(busId: string): Promise<void> {
    await this.client.del(this.busKey(busId));
  }

  // ── Generic helpers (used by throttler storage or session state) ──────────
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }
}
