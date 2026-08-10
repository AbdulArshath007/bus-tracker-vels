import {
  Controller, Get, Post, Patch, Param, Body, UseGuards, Req,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { BusesService, CreateBusDto, AssignBusDto } from './buses.service';
import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class RerouteDto {
  @ApiProperty() @IsUUID() new_route_id: string;
}

@ApiTags('buses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('buses')
export class BusesController {
  constructor(private busesService: BusesService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'List all buses with current assignment (admin)' })
  findAll() { return this.busesService.findAll(); }

  @Post()
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a bus (admin)' })
  create(@Body() dto: CreateBusDto, @Req() req: any) {
    return this.busesService.create(dto, req.user.id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update bus details (admin)' })
  update(@Param('id') id: string, @Body() dto: CreateBusDto, @Req() req: any) {
    return this.busesService.update(id, dto, req.user.id);
  }

  @Post(':id/assign')
  @Roles('admin')
  @ApiOperation({ summary: 'Assign driver and route to bus (admin)' })
  assign(@Param('id') id: string, @Body() dto: AssignBusDto, @Req() req: any) {
    return this.busesService.assign(id, dto, req.user.id);
  }

  @Post(':id/reroute')
  @Roles('admin')
  @ApiOperation({ summary: 'Reroute active bus (admin)' })
  reroute(@Param('id') id: string, @Body() dto: RerouteDto, @Req() req: any) {
    return this.busesService.reroute(id, dto.new_route_id, req.user.id);
  }

  @Get(':id/location')
  @Roles('student', 'admin')
  @ApiOperation({ summary: 'Get last-known bus location (REST fallback)' })
  getLocation(@Param('id') id: string, @Req() req: any) {
    return this.busesService.getLocation(id, req.user.id, req.user.role);
  }
}
