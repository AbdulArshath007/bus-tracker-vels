// ─── Audit Service ────────────────────────────────────────────────────────────
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

export interface AuditEntry {
  actorId?: string;
  actorRole?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog) private repo: Repository<AuditLog>,
  ) {}

  async log(entry: AuditEntry): Promise<void> {
    const record = this.repo.create({
      actorId: entry.actorId ?? undefined,
      actorRole: entry.actorRole ?? undefined,
      action: entry.action,
      targetType: entry.targetType ?? undefined,
      targetId: entry.targetId ?? undefined,
      metadata: entry.metadata ?? undefined,
      ipAddress: entry.ipAddress ?? undefined,
    });
    // Fire-and-forget; audit writes must not block the main request
    this.repo.save(record).catch(() => {
      // Structured log only — audit failures should never propagate to caller
    });
  }

  async search(filters: {
    actorId?: string;
    action?: string;
    targetType?: string;
    from?: Date;
    to?: Date;
    q?: string;
    limit?: number;
    cursor?: string; // last seen id (bigint as string)
  }): Promise<{ data: AuditLog[]; hasMore: boolean }> {
    const limit = Math.min(filters.limit ?? 50, 100);
    const qb = this.repo.createQueryBuilder('al');

    if (filters.actorId) qb.andWhere('al.actor_id = :actorId', { actorId: filters.actorId });
    if (filters.action) qb.andWhere('al.action ILIKE :action', { action: `%${filters.action}%` });
    if (filters.targetType) qb.andWhere('al.target_type = :targetType', { targetType: filters.targetType });
    if (filters.from) qb.andWhere('al.created_at >= :from', { from: filters.from });
    if (filters.to) qb.andWhere('al.created_at <= :to', { to: filters.to });
    if (filters.q) {
      qb.andWhere(
        `(al.action ILIKE :q OR al.target_id::text ILIKE :q)`,
        { q: `%${filters.q}%` },
      );
    }
    if (filters.cursor) {
      qb.andWhere('al.id < :cursor', { cursor: filters.cursor });
    }

    qb.orderBy('al.id', 'DESC').take(limit + 1);

    const rows = await qb.getMany();
    const hasMore = rows.length > limit;
    return { data: rows.slice(0, limit), hasMore };
  }
}
