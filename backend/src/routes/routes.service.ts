// ─── Routes Service ───────────────────────────────────────────────────────────
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Route } from './entities/route.entity';
import { Stop } from './entities/stop.entity';
import { ChatRoomMember } from '../chat/entities/chat-room-member.entity';
import { AuditService } from '../audit/audit.service';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class StopDto {
  @ApiProperty() @IsNotEmpty() stop_name: string;
  @ApiProperty({ required: false }) @IsOptional() stop_name_ta?: string;
  @ApiProperty() @IsNumber() sequence_num: number;
  @ApiProperty() @IsNumber() latitude: number;
  @ApiProperty() @IsNumber() longitude: number;
  @ApiProperty({ required: false }) @IsOptional() scheduled_time?: string;
}

export class CreateRouteDto {
  @ApiProperty() @IsNotEmpty() route_name: string;
  @ApiProperty({ required: false }) @IsOptional() route_name_ta?: string;
  @ApiProperty({ required: false }) @IsOptional() description?: string;
  @ApiProperty({ type: [StopDto], required: false }) @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => StopDto) stops?: StopDto[];
}

// GpsGateway injected lazily
let _gateway: any;
export function setRoutesGateway(g: any) { _gateway = g; }

@Injectable()
export class RoutesService {
  constructor(
    @InjectRepository(Route) private routeRepo: Repository<Route>,
    @InjectRepository(Stop) private stopRepo: Repository<Stop>,
    @InjectRepository(ChatRoomMember) private memberRepo: Repository<ChatRoomMember>,
    private auditService: AuditService,
  ) {}

  async findAll(userId: string, role: string) {
    if (role === 'admin') {
      return this.routeRepo.find({ relations: ['stops'], order: { routeName: 'ASC' } });
    }
    // Students/drivers: find their assigned route via chat room membership
    const membership = await this.memberRepo.findOne({
      where: { userId },
      relations: ['room', 'room.route', 'room.route.stops'],
    });
    if (!membership?.room?.route) return [];
    return [membership.room.route];
  }

  async create(dto: CreateRouteDto, actorId: string): Promise<Route> {
    const route = this.routeRepo.create({
      routeName: dto.route_name,
      routeNameTa: dto.route_name_ta,
      description: dto.description,
    });
    await this.routeRepo.save(route);

    if (dto.stops?.length) {
      const stops = dto.stops.map((s) =>
        this.stopRepo.create({
          routeId: route.id,
          stopName: s.stop_name,
          stopNameTa: s.stop_name_ta,
          sequenceNum: s.sequence_num,
          latitude: s.latitude,
          longitude: s.longitude,
          scheduledTime: s.scheduled_time,
        }),
      );
      await this.stopRepo.save(stops);
    }

    await this.auditService.log({
      actorId, actorRole: 'admin', action: 'route.create',
      targetType: 'route', targetId: route.id,
    });
    return this.findOne(route.id);
  }

  async findOne(id: string): Promise<Route> {
    const route = await this.routeRepo.findOne({
      where: { id },
      relations: ['stops'],
    });
    if (!route) throw new NotFoundException('Route not found');
    return route;
  }

  async update(routeId: string, dto: Partial<CreateRouteDto>, actorId: string) {
    const route = await this.routeRepo.findOneOrFail({ where: { id: routeId } });
    if (dto.route_name) route.routeName = dto.route_name;
    if (dto.route_name_ta) route.routeNameTa = dto.route_name_ta;
    if (dto.description) route.description = dto.description;
    await this.routeRepo.save(route);

    // Emit socket event so clients refetch
    _gateway?.emitToRoom('admin:all', 'route.updated', { route_id: routeId, updated_at: new Date() });

    await this.auditService.log({
      actorId, actorRole: 'admin', action: 'route.update',
      targetType: 'route', targetId: routeId,
    });
    return route;
  }

  async addStop(routeId: string, dto: StopDto, actorId: string) {
    const stop = this.stopRepo.create({
      routeId,
      stopName: dto.stop_name,
      stopNameTa: dto.stop_name_ta,
      sequenceNum: dto.sequence_num,
      latitude: dto.latitude,
      longitude: dto.longitude,
      scheduledTime: dto.scheduled_time,
    });
    await this.stopRepo.save(stop);
    _gateway?.emitToRoom('admin:all', 'route.updated', { route_id: routeId, updated_at: new Date() });
    return stop;
  }

  async updateStop(stopId: string, dto: Partial<StopDto>, actorId: string) {
    const stop = await this.stopRepo.findOneOrFail({ where: { id: stopId } });
    Object.assign(stop, {
      stopName: dto.stop_name ?? stop.stopName,
      stopNameTa: dto.stop_name_ta ?? stop.stopNameTa,
      sequenceNum: dto.sequence_num ?? stop.sequenceNum,
      latitude: dto.latitude ?? stop.latitude,
      longitude: dto.longitude ?? stop.longitude,
      scheduledTime: dto.scheduled_time ?? stop.scheduledTime,
    });
    await this.stopRepo.save(stop);
    _gateway?.emitToRoom('admin:all', 'route.updated', { route_id: stop.routeId, updated_at: new Date() });
    return stop;
  }

  async deleteStop(stopId: string, actorId: string) {
    const stop = await this.stopRepo.findOneOrFail({ where: { id: stopId } });
    await this.stopRepo.remove(stop);
    _gateway?.emitToRoom('admin:all', 'route.updated', { route_id: stop.routeId, updated_at: new Date() });
  }
}
