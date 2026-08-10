// ─── Buses Service ────────────────────────────────────────────────────────────
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bus } from './entities/bus.entity';
import { BusAssignment } from './entities/bus-assignment.entity';
import { Route } from '../routes/entities/route.entity';
import { User } from '../users/entities/user.entity';
import { AuditService } from '../audit/audit.service';
import { RedisService } from '../common/redis/redis.service';
import { IsNotEmpty, IsOptional, IsString, IsInt, Min, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBusDto {
  @ApiProperty() @IsNotEmpty() @IsString() bus_number: string;
  @ApiProperty() @IsNotEmpty() @IsString() plate_number: string;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() @Min(1) capacity?: number;
}

export class AssignBusDto {
  @ApiProperty() @IsUUID() driver_id: string;
  @ApiProperty() @IsUUID() route_id: string;
}

// GpsGateway injected lazily
let _gateway: any;
export function setBusGateway(g: any) { _gateway = g; }

@Injectable()
export class BusesService {
  constructor(
    @InjectRepository(Bus) private busRepo: Repository<Bus>,
    @InjectRepository(BusAssignment)
    private assignmentRepo: Repository<BusAssignment>,
    @InjectRepository(Route) private routeRepo: Repository<Route>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private auditService: AuditService,
    private redisService: RedisService,
  ) {}

  async findAll() {
    const buses = await this.busRepo.find({ where: { isActive: true } });
    const result: any[] = [];
    for (const bus of buses) {
      const assignment = await this.assignmentRepo.findOne({
        where: { busId: bus.id, isCurrent: true },
        relations: ['route', 'driver'],
      });
      result.push({
        ...bus,
        current_assignment: assignment
          ? {
              route_id: assignment.routeId,
              route_name: assignment.route?.routeName,
              driver_id: assignment.driverId,
              driver_name: assignment.driver?.fullName,
            }
          : null,
      });
    }
    return result;
  }

  async create(dto: CreateBusDto, actorId: string) {
    const bus = this.busRepo.create({
      busNumber: dto.bus_number,
      plateNumber: dto.plate_number,
      capacity: dto.capacity ?? 60,
    });
    await this.busRepo.save(bus);
    await this.auditService.log({
      actorId,
      actorRole: 'admin',
      action: 'bus.create',
      targetType: 'bus',
      targetId: bus.id,
      metadata: { busNumber: dto.bus_number },
    });
    return bus;
  }

  async update(busId: string, dto: Partial<CreateBusDto>, actorId: string) {
    const bus = await this.busRepo.findOneOrFail({ where: { id: busId } });
    if (dto.bus_number) bus.busNumber = dto.bus_number;
    if (dto.plate_number) bus.plateNumber = dto.plate_number;
    if (dto.capacity) bus.capacity = dto.capacity;
    await this.busRepo.save(bus);
    await this.auditService.log({
      actorId, actorRole: 'admin', action: 'bus.update',
      targetType: 'bus', targetId: busId,
    });
    return bus;
  }

  async assign(busId: string, dto: AssignBusDto, actorId: string) {
    // Validate driver has 'driver' role
    const driver = await this.userRepo.findOne({
      where: { id: dto.driver_id, role: 'driver', isActive: true },
    });
    if (!driver) throw new BadRequestException('Driver not found or not active.');

    const route = await this.routeRepo.findOne({ where: { id: dto.route_id } });
    if (!route) throw new BadRequestException('Route not found.');

    // Close existing assignment
    await this.assignmentRepo.update(
      { busId, isCurrent: true },
      { isCurrent: false },
    );

    const assignment = this.assignmentRepo.create({
      busId,
      routeId: dto.route_id,
      driverId: dto.driver_id,
      isCurrent: true,
    });
    await this.assignmentRepo.save(assignment);

    await this.auditService.log({
      actorId, actorRole: 'admin', action: 'bus.assign',
      targetType: 'bus', targetId: busId,
      metadata: { driverId: dto.driver_id, routeId: dto.route_id },
    });
    return assignment;
  }

  async reroute(busId: string, newRouteId: string, actorId: string) {
    const assignment = await this.assignmentRepo.findOne({
      where: { busId, isCurrent: true },
    });
    if (!assignment) throw new NotFoundException('No active assignment.');

    const oldRouteId = assignment.routeId;
    assignment.routeId = newRouteId;
    await this.assignmentRepo.save(assignment);

    _gateway?.emitToBus(busId, 'bus.rerouted', {
      bus_id: busId,
      new_route_id: newRouteId,
      rerouted_by: actorId,
      at: new Date(),
    });

    await this.auditService.log({
      actorId, actorRole: 'admin', action: 'bus.reroute',
      targetType: 'bus', targetId: busId,
      metadata: { oldRouteId, newRouteId },
    });
    return assignment;
  }

  async getLocation(busId: string, requesterId: string, requesterRole: string) {
    // Students: must be assigned to this bus's route
    // Handled in controller via guard; here we just return
    const loc = await this.redisService.getLocation(busId);
    return {
      bus_id: busId,
      ...(loc ?? { latitude: null, longitude: null, speed_kmh: null, heading: null, timestamp: null, is_live: false }),
    };
  }
}
