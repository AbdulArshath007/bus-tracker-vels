// ─── Entity: ScheduledJobLog ──────────────────────────────────────────────────
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('scheduled_job_log')
export class ScheduledJobLog {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ name: 'job_name' })
  jobName: string;

  @CreateDateColumn({ name: 'started_at' })
  startedAt: Date;

  @Column({ name: 'finished_at', nullable: true, type: 'timestamptz' })
  finishedAt: Date;

  // 'success' | 'failed' | 'running'
  @Column({ default: 'running' })
  status: string;

  @Column({ name: 'rows_affected', nullable: true })
  rowsAffected: number;

  @Column({ name: 'error_message', nullable: true, type: 'text' })
  errorMessage: string;
}
