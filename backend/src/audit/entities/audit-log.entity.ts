// ─── Entity: AuditLog ────────────────────────────────────────────────────────
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('audit_log')
@Index(['createdAt'])
@Index(['actorId'])
@Index(['action'])
export class AuditLog {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ name: 'actor_id', nullable: true })
  actorId: string;

  @Column({ name: 'actor_role', nullable: true })
  actorRole: string;

  @Column()
  action: string;

  @Column({ name: 'target_type', nullable: true })
  targetType: string;

  @Column({ name: 'target_id', nullable: true })
  targetId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @Column({ name: 'ip_address', nullable: true, type: 'inet' })
  ipAddress: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
