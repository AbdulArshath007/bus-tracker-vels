// ─── Redis Service with In-Memory Fallback ────────────────────────────────────
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
  private client: Redis | null = null;
  private readonly inMemoryCache = new Map<string, string>();
  private isConnected = false;

  constructor(private configService: ConfigService) {
    try {
      this.client = new Redis({
        host: configService.get<string>('redis.host') || 'localhost',
        port: configService.get<number>('redis.port') || 6379,
        password: configService.get<string>('redis.password') || undefined,
        lazyConnect: true,
        enableOfflineQueue: false,
        retryStrategy: () => null,
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log('Redis connected successfully.');
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        this.logger.warn(`Redis unavailable (${err.message}). Using in-memory store fallback.`);
      });

      this.client.connect().catch(() => {
        this.isConnected = false;
      });
    } catch {
      this.isConnected = false;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      try {
        await this.client.quit();
      } catch (_) {}
    }
  }

  // ── Bus location cache ────────────────────────────────────────────────────
  private busKey(busId: string) {
    return `bus:location:${busId}`;
  }

  async setLocation(busId: string, loc: LastKnownLocation): Promise<void> {
    const key = this.busKey(busId);
    const value = JSON.stringify(loc);
    this.inMemoryCache.set(key, value);
    if (this.isConnected && this.client) {
      try {
        await this.client.set(key, value, 'EX', 86400);
      } catch (_) {}
    }
  }

  async getLocation(busId: string): Promise<LastKnownLocation | null> {
    const key = this.busKey(busId);
    if (this.isConnected && this.client) {
      try {
        const raw = await this.client.get(key);
        if (raw) return JSON.parse(raw) as LastKnownLocation;
      } catch (_) {}
    }
    const mem = this.inMemoryCache.get(key);
    return mem ? (JSON.parse(mem) as LastKnownLocation) : null;
  }

  async markLocationStale(busId: string): Promise<void> {
    const key = this.busKey(busId);
    const raw = await this.getLocation(busId);
    if (!raw) return;
    raw.isLive = false;
    await this.setLocation(busId, raw);
  }

  async clearLocation(busId: string): Promise<void> {
    const key = this.busKey(busId);
    this.inMemoryCache.delete(key);
    if (this.isConnected && this.client) {
      try {
        await this.client.del(key);
      } catch (_) {}
    }
  }

  // ── Generic helpers (used by throttler storage or session state) ──────────
  async get(key: string): Promise<string | null> {
    if (this.isConnected && this.client) {
      try {
        return await this.client.get(key);
      } catch (_) {}
    }
    return this.inMemoryCache.get(key) || null;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    this.inMemoryCache.set(key, value);
    if (this.isConnected && this.client) {
      try {
        if (ttlSeconds) {
          await this.client.set(key, value, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, value);
        }
      } catch (_) {}
    }
  }

  async del(key: string): Promise<void> {
    this.inMemoryCache.delete(key);
    if (this.isConnected && this.client) {
      try {
        await this.client.del(key);
      } catch (_) {}
    }
  }
}
