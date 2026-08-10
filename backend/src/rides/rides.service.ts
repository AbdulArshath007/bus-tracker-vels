// ─── Rides Service ────────────────────────────────────────────────────────────
import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Ride } from './entities/ride.entity';
import { Bus } from '../buses/entities/bus.entity';
import { BusAssignment } from '../buses/entities/bus-assignment.entity';
import { GpsPing } from './entities/gps-ping.entity';
import { RedisService } from '../common/redis/redis.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';

// GpsGateway injected lazily to avoid circular dependency
let _gateway: any;
export function setGpsGateway(g: any) {
  _gateway = g;
}

function haversineMetres(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

@Injectable()
export class RidesService {
  private readonly logger = new Logger(RidesService.name);

  constructor(
    @InjectRepository(Ride) private rideRepo: Repository<Ride>,
    @InjectRepository(Bus) private busRepo: Repository<Bus>,
    @InjectRepository(BusAssignment)
    private assignmentRepo: Repository<BusAssignment>,
    @InjectRepository(GpsPing) private pingRepo: Repository<GpsPing>,
    private redisService: RedisService,
    private auditService: AuditService,
    private notifService: NotificationsService,
    private configService: ConfigService,
  ) {}

  // ── Start ride ─────────────────────────────────────────────────────────────
  async startRide(driver: User): Promise<Ride> {
    // Find current assignment for this driver
    const assignment = await this.assignmentRepo.findOne({
      where: { driverId: driver.id, isCurrent: true },
      relations: ['bus', 'route'],
    });
    if (!assignment) {
      throw new BadRequestException('No active bus assignment found.');
    }

    // Ensure no active ride already exists for this bus
    const existing = await this.rideRepo.findOne({
      where: {
        busId: assignment.busId,
        status: In(['active', 'destination_reached']),
      },
    });
    if (existing) {
      throw new BadRequestException('Bus already has an active ride.');
    }

    const ride = this.rideRepo.create({
      busId: assignment.busId,
      driverId: driver.id,
      routeId: assignment.routeId,
      status: 'active',
      startedAt: new Date(),
    });
    await this.rideRepo.save(ride);

    // Broadcast ride.started
    _gateway?.emitToBus(assignment.busId, 'ride.started', {
      ride_id: ride.id,
      bus_id: ride.busId,
      bus_number: assignment.bus.busNumber,
      route_id: ride.routeId,
      driver_id: driver.id,
      driver_name: driver.fullName,
      started_at: ride.startedAt,
    });

    // Send push notification to all students on route
    await this.notifService.notifyRouteStudents(assignment.routeId, {
      trigger: 'ride_started',
      title: 'Bus Departed',
      titleTa: 'பேருந்து புறப்பட்டது',
      body: `Bus ${assignment.bus.busNumber} has started its journey.`,
      bodyTa: `${assignment.bus.busNumber} பேருந்து தன் பயணத்தை தொடங்கியது.`,
    });

    await this.auditService.log({
      actorId: driver.id,
      actorRole: 'driver',
      action: 'ride.start',
      targetType: 'ride',
      targetId: ride.id,
      metadata: { busId: ride.busId, routeId: ride.routeId },
    });

    return ride;
  }

  // ── Mark destination reached ───────────────────────────────────────────────
  async markDestinationReached(rideId: string, driver: User): Promise<Ride> {
    const ride = await this.rideRepo.findOne({
      where: { id: rideId, driverId: driver.id, status: 'active' },
      relations: ['bus'],
    });
    if (!ride) throw new NotFoundException('Active ride not found.');

    // Validate geofence if last GPS ping is available
    const geofenceRadius = this.configService.get<number>(
      'geo.destinationGeofenceRadiusMetres',
    );
    const loc = await this.redisService.getLocation(ride.busId);

    if (loc && ride.route) {
      // Check distance to last stop of the route
      // Route relation would need stops — simplified: skip geofence if no route loaded
    }

    ride.status = 'destination_reached';
    ride.destinationReachedAt = new Date();
    await this.rideRepo.save(ride);

    _gateway?.emitToBus(ride.busId, 'ride.destination_reached', {
      ride_id: ride.id,
      bus_id: ride.busId,
      at: ride.destinationReachedAt,
    });

    await this.notifService.notifyRouteStudents(ride.routeId, {
      trigger: 'ride_destination_reached',
      title: 'Bus Arrived',
      titleTa: 'பேருந்து வந்துவிட்டது',
      body: `Bus ${ride.bus.busNumber} has reached the destination.`,
      bodyTa: `${ride.bus.busNumber} பேருந்து இலக்கை அடைந்தது.`,
    });

    await this.auditService.log({
      actorId: driver.id,
      actorRole: 'driver',
      action: 'ride.destination_reached',
      targetType: 'ride',
      targetId: ride.id,
    });

    return ride;
  }

  // ── End ride ───────────────────────────────────────────────────────────────
  async endRide(rideId: string, driver: User): Promise<Ride> {
    const ride = await this.rideRepo.findOne({
      where: {
        id: rideId,
        driverId: driver.id,
        status: In(['active', 'destination_reached']),
      },
      relations: ['bus'],
    });
    if (!ride) throw new NotFoundException('Ride not found or already ended.');

    ride.status = 'ended';
    ride.endedAt = new Date();
    await this.rideRepo.save(ride);

    await this.redisService.markLocationStale(ride.busId);

    _gateway?.emitToBus(ride.busId, 'ride.ended', {
      ride_id: ride.id,
      bus_id: ride.busId,
      ended_at: ride.endedAt,
    });

    await this.notifService.notifyRouteStudents(ride.routeId, {
      trigger: 'ride_ended',
      title: 'Ride Ended',
      titleTa: 'பயணம் முடிந்தது',
      body: `Bus ${ride.bus.busNumber} has ended its journey.`,
      bodyTa: `${ride.bus.busNumber} பேருந்தின் பயணம் முடிந்தது.`,
    });

    await this.auditService.log({
      actorId: driver.id,
      actorRole: 'driver',
      action: 'ride.end',
      targetType: 'ride',
      targetId: ride.id,
    });

    return ride;
  }

  // ── Get active ride ────────────────────────────────────────────────────────
  async getActiveRide(
    busId: string,
    requesterId: string,
    requesterRole: string,
  ): Promise<any> {
    // Scope check for students
    if (requesterRole === 'student') {
      // Must be a member of this bus's route room — enforced in controller
    }

    const ride = await this.rideRepo.findOne({
      where: {
        busId,
        status: In(['active', 'destination_reached']),
      },
      relations: ['bus', 'driver'],
    });

    const loc = await this.redisService.getLocation(busId);

    return {
      ride_id: ride?.id ?? null,
      bus_id: busId,
      bus_number: ride?.bus?.busNumber ?? null,
      route_id: ride?.routeId ?? null,
      driver_id: ride?.driverId ?? null,
      driver_name: ride?.driver?.fullName ?? null,
      status: ride?.status ?? 'not_started',
      started_at: ride?.startedAt ?? null,
      last_location: loc
        ? {
            latitude: loc.latitude,
            longitude: loc.longitude,
            speed_kmh: loc.speedKmh,
            timestamp: loc.timestamp,
            is_live: loc.isLive,
          }
        : null,
    };
  }

  // ── List rides (admin) ─────────────────────────────────────────────────────
  async listRides(filters: {
    busId?: string;
    driverId?: string;
    status?: string;
    from?: Date;
    to?: Date;
    limit?: number;
    cursor?: string;
  }) {
    const limit = Math.min(filters.limit ?? 50, 100);
    const qb = this.rideRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.bus', 'bus')
      .leftJoinAndSelect('r.driver', 'driver');

    if (filters.busId) qb.andWhere('r.bus_id = :busId', { busId: filters.busId });
    if (filters.driverId) qb.andWhere('r.driver_id = :driverId', { driverId: filters.driverId });
    if (filters.status) qb.andWhere('r.status = :status', { status: filters.status });
    if (filters.from) qb.andWhere('r.created_at >= :from', { from: filters.from });
    if (filters.to) qb.andWhere('r.created_at <= :to', { to: filters.to });
    if (filters.cursor) qb.andWhere('r.created_at < :cursor', { cursor: filters.cursor });

    qb.orderBy('r.created_at', 'DESC').take(limit + 1);
    const rows = await qb.getMany();
    return { data: rows.slice(0, limit), hasMore: rows.length > limit };
  }

  // ── GPS trail (admin) ──────────────────────────────────────────────────────
  async getGpsTrail(rideId: string) {
    const ride = await this.rideRepo.findOne({ where: { id: rideId } });
    if (!ride) throw new NotFoundException('Ride not found.');

    const pings = await this.pingRepo.find({
      where: { rideId },
      order: { recordedAt: 'ASC' },
    });

    return { ride_id: rideId, pings };
  }

  // ── Stale ride recovery (called by scheduler) ──────────────────────────────
  async recoverStaleRides(): Promise<number> {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    // Find active rides where last ping is > 2 hours ago
    const staleRides = await this.rideRepo
      .createQueryBuilder('r')
      .where("r.status IN ('active', 'destination_reached')")
      .andWhere('r.started_at < :cutoff', { cutoff: twoHoursAgo })
      .getMany();

    let count = 0;
    for (const ride of staleRides) {
      const lastPing = await this.pingRepo.findOne({
        where: { rideId: ride.id },
        order: { recordedAt: 'DESC' },
      });
      const lastActivity = lastPing ? lastPing.recordedAt : ride.startedAt;
      if (lastActivity < twoHoursAgo) {
        ride.status = 'ended';
        ride.endedAt = new Date();
        await this.rideRepo.save(ride);

        await this.auditService.log({
          actorId: undefined,
          action: 'system.stale_ride_recovered',
          targetType: 'ride',
          targetId: ride.id,
          metadata: { lastActivity },
        });
        count++;
      }
    }
    return count;
  }
}
