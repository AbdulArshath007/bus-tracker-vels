import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { RoutesService, CreateRouteDto } from './routes.service';

@ApiTags('routes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('routes')
export class RoutesController {
  constructor(private routesService: RoutesService) {}

  @Get()
  @Roles('student', 'driver', 'admin')
  @ApiOperation({ summary: 'List routes (scoped by role)' })
  findAll(@Req() req: any) {
    return this.routesService.findAll(req.user.id, req.user.role);
  }

  @Post()
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create route (admin)' })
  create(@Body() dto: CreateRouteDto, @Req() req: any) {
    return this.routesService.create(dto, req.user.id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update route (admin)' })
  update(@Param('id') id: string, @Body() dto: CreateRouteDto, @Req() req: any) {
    return this.routesService.update(id, dto, req.user.id);
  }

  @Post(':id/stops')
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add stop to route (admin)' })
  addStop(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    return this.routesService.addStop(id, dto, req.user.id);
  }

  @Patch(':id/stops/:stopId')
  @Roles('admin')
  @ApiOperation({ summary: 'Update a stop (admin)' })
  updateStop(@Param('stopId') stopId: string, @Body() dto: any, @Req() req: any) {
    return this.routesService.updateStop(stopId, dto, req.user.id);
  }

  @Delete(':id/stops/:stopId')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a stop (admin)' })
  deleteStop(@Param('stopId') stopId: string, @Req() req: any) {
    return this.routesService.deleteStop(stopId, req.user.id);
  }
}
