// ─── Notifications Log Controller ────────────────────────────────────────────
// Appended to notifications module — admin-only paginated read of notifications_log
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { NotificationLog } from './entities/notification-log.entity';

@ApiTags('logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('notifications-log')
export class NotificationsLogController {
  constructor(
    @InjectRepository(NotificationLog)
    private repo: Repository<NotificationLog>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Search notification log (admin)' })
  async search(
    @Query('recipient_id') recipientId?: string,
    @Query('trigger_event') triggerEvent?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    const lim = Math.min(parseInt(limit ?? '50', 10), 100);
    const qb = this.repo.createQueryBuilder('n');

    if (recipientId) qb.andWhere('n.recipient_id = :recipientId', { recipientId });
    if (triggerEvent) qb.andWhere('n.trigger_event = :triggerEvent', { triggerEvent });
    if (from) qb.andWhere('n.sent_at >= :from', { from: new Date(from) });
    if (to) qb.andWhere('n.sent_at <= :to', { to: new Date(to) });
    if (cursor) qb.andWhere('n.sent_at < :cursor', { cursor });

    qb.orderBy('n.sent_at', 'DESC').take(lim + 1);
    const rows = await qb.getMany();
    return { data: rows.slice(0, lim), hasMore: rows.length > lim };
  }
}
