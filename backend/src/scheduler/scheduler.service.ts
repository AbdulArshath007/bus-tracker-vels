import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { NotificationLog } from '../notifications/entities/notification-log.entity';
import { ScheduledJobLog } from '../common/entities/scheduled-job-log.entity';
import { Stop } from '../routes/entities/stop.entity';
import { ChatService } from '../chat/chat.service';
import { RidesService } from '../rides/rides.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectRepository(AuditLog) private auditLogRepo: Repository<AuditLog>,
    @InjectRepository(NotificationLog)
    private notifLogRepo: Repository<NotificationLog>,
    @InjectRepository(ScheduledJobLog)
    private jobLogRepo: Repository<ScheduledJobLog>,
    @InjectRepository(Stop) private stopRepo: Repository<Stop>,
    private chatService: ChatService,
    private ridesService: RidesService,
    private auditService: AuditService,
    private notificationsService: NotificationsService,
  ) {}

  // ── Attachment cleanup: daily at 02:00 ───────────────────────────────────
  @Cron('0 2 * * *')
  async runAttachmentCleanup() {
    this.logger.log('Starting attachment cleanup job');
    await this.chatService.runAttachmentCleanup();
  }

  // ── Audit log cleanup: daily at 02:30 ────────────────────────────────────
  @Cron('30 2 * * *')
  async runAuditLogCleanup() {
    const jobLog = this.jobLogRepo.create({ jobName: 'audit-log-cleanup' });
    await this.jobLogRepo.save(jobLog);
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 60);
      const result = await this.auditLogRepo.delete({
        createdAt: LessThan(cutoff),
      });
      const rowsAffected = result.affected ?? 0;

      jobLog.status = 'success';
      jobLog.rowsAffected = rowsAffected;
      jobLog.finishedAt = new Date();
      await this.jobLogRepo.save(jobLog);

      this.logger.log(`Audit log cleanup: ${rowsAffected} rows deleted.`);
    } catch (err) {
      jobLog.status = 'failed';
      jobLog.errorMessage = err.message;
      jobLog.finishedAt = new Date();
      await this.jobLogRepo.save(jobLog);
      this.logger.error(`Audit log cleanup FAILED: ${err.message}`);
    }
  }

  // ── Notification log cleanup: daily at 02:45 ─────────────────────────────
  @Cron('45 2 * * *')
  async runNotificationLogCleanup() {
    const jobLog = this.jobLogRepo.create({
      jobName: 'notification-log-cleanup',
    });
    await this.jobLogRepo.save(jobLog);
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 60);
      const result = await this.notifLogRepo.delete({
        sentAt: LessThan(cutoff),
      });
      const rowsAffected = result.affected ?? 0;

      jobLog.status = 'success';
      jobLog.rowsAffected = rowsAffected;
      jobLog.finishedAt = new Date();
      await this.jobLogRepo.save(jobLog);

      this.logger.log(
        `Notification log cleanup: ${rowsAffected} rows deleted.`,
      );
    } catch (err) {
      jobLog.status = 'failed';
      jobLog.errorMessage = err.message;
      jobLog.finishedAt = new Date();
      await this.jobLogRepo.save(jobLog);
      this.logger.error(`Notification log cleanup FAILED: ${err.message}`);
    }
  }

  // ── Stale ride recovery: every 30 minutes ────────────────────────────────
  @Cron('*/30 * * * *')
  async runStaleRideRecovery() {
    const jobLog = this.jobLogRepo.create({ jobName: 'stale-ride-recovery' });
    await this.jobLogRepo.save(jobLog);
    try {
      const count = await this.ridesService.recoverStaleRides();
      jobLog.status = 'success';
      jobLog.rowsAffected = count;
      jobLog.finishedAt = new Date();
      await this.jobLogRepo.save(jobLog);
      if (count > 0) {
        this.logger.warn(`Stale ride recovery: ${count} rides auto-ended.`);
      }
    } catch (err) {
      jobLog.status = 'failed';
      jobLog.errorMessage = err.message;
      jobLog.finishedAt = new Date();
      await this.jobLogRepo.save(jobLog);
      this.logger.error(`Stale ride recovery FAILED: ${err.message}`);
    }
  }

  // ── Pre-ride notification: every minute ────────────────────────────────────
  @Cron('* * * * *')
  async runPreRideNotifications() {
    // Find all terminal stops (sequence_num = 1) that have a scheduled time
    const now = new Date();
    // compute target time: 10 minutes from now
    const target = new Date(now.getTime() + 10 * 60000);
    const targetTimeStr = `${target.getHours().toString().padStart(2, '0')}:${target.getMinutes().toString().padStart(2, '0')}`;

    try {
      const upcomingTerminals = await this.stopRepo.find({
        where: { sequenceNum: 1, scheduledTime: targetTimeStr },
        relations: ['route'],
      });

      for (const stop of upcomingTerminals) {
        if (!stop.route) continue;
        await this.notificationsService.notifyRouteStudents(stop.routeId, {
          trigger: 'bus_approaching',
          title: 'Bus Approaching',
          titleTa: 'பேருந்து நெருங்குகிறது',
          body: `Your bus for route ${stop.route.routeName} is scheduled to depart in 10 minutes.`,
          bodyTa: `உங்கள் வழித்தடமான ${stop.route.routeName} பேருந்து 10 நிமிடங்களில் புறப்படும்.`,
        });
        this.logger.log(`Sent pre-ride notifications for route ${stop.route.routeName}`);
      }
    } catch (err) {
      this.logger.error(`Pre-ride notification job FAILED: ${err.message}`);
    }
  }
}
