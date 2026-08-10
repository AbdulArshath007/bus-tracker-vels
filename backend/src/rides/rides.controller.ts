// ─── Rides Controller ─────────────────────────────────────────────────────────
import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { RidesService } from './rides.service';

@ApiTags('rides')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rides')
export class RidesController {
  constructor(private ridesService: RidesService) {}

  @Post()
  @Roles('driver')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Start a ride (driver only)' })
  startRide(@Req() req: any) {
    return this.ridesService.startRide(req.user);
  }

  @Get('active')
  @Roles('student', 'driver', 'admin')
  @ApiOperation({ summary: 'Get active ride for a bus' })
  getActive(@Req() req: any, @Query('bus_id') busId: string) {
    return this.ridesService.getActiveRide(busId, req.user.id, req.user.role);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'List ride history (admin)' })
  list(
    @Query('bus_id') busId?: string,
    @Query('driver_id') driverId?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.ridesService.listRides({
      busId,
      driverId,
      status,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      limit: limit ? parseInt(limit, 10) : 50,
      cursor,
    });
  }

  @Patch(':id/destination-reached')
  @Roles('driver')
  @ApiOperation({ summary: 'Mark destination reached (driver only)' })
  destinationReached(@Param('id') id: string, @Req() req: any) {
    return this.ridesService.markDestinationReached(id, req.user);
  }

  @Patch(':id/end')
  @Roles('driver')
  @ApiOperation({ summary: 'End a ride (driver only)' })
  endRide(@Param('id') id: string, @Req() req: any) {
    return this.ridesService.endRide(id, req.user);
  }

  @Get(':id/gps-trail')
  @Roles('admin')
  @ApiOperation({ summary: 'Get full GPS trail for a ride (admin)' })
  gpsTrail(@Param('id') id: string) {
    return this.ridesService.getGpsTrail(id);
  }
}
