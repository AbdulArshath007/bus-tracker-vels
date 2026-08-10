// ─── Audit Controller ─────────────────────────────────────────────────────────
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { AuditService } from './audit.service';

@ApiTags('logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('audit-log')
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Search audit log (admin only)' })
  async search(
    @Query('actor_id') actorId?: string,
    @Query('action') action?: string,
    @Query('target_type') targetType?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('q') q?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.auditService.search({
      actorId,
      action,
      targetType,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      q,
      limit: limit ? parseInt(limit, 10) : 50,
      cursor,
    });
  }
}
