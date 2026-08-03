import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

/**
 * Registro de auditoría (append-only). Protegido a nivel BD: no se permite
 * UPDATE/DELETE (trigger trg_audit_no_update).
 */
@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'int', name: 'user_id', nullable: true })
  userId: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column({ length: 60 })
  action: string;

  @Index()
  @Column({ name: 'resource_type', length: 60 })
  resourceType: string;

  @Index()
  @Column({ name: 'resource_id', type: 'varchar', length: 60, nullable: true })
  resourceId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'inet', nullable: true })
  ip: string | null;

  @Column({ type: 'varchar', name: 'user_agent', length: 300, nullable: true })
  userAgent: string | null;

  @Index()
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
