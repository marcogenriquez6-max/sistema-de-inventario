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

export type CashStatus = 'OPEN' | 'CLOSED';

/**
 * Apertura/cierre de caja. Cada operador abre su caja con un saldo inicial
 * y la cierra registrando el conteo físico para detectar descuadres.
 */
@Entity('cash_registers')
export class CashRegister {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'opened_by' })
  openedBy: number;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'opened_by' })
  opener: User;

  @Column({
    name: 'initial_balance',
    type: 'numeric',
    precision: 14,
    scale: 2,
    default: '0',
  })
  initialBalance: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: '0' })
  expected: string;

  @Column({
    name: 'counted_amount',
    type: 'numeric',
    precision: 14,
    scale: 2,
    nullable: true,
  })
  countedAmount: string | null;

  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: true })
  difference: string | null;

  @Index()
  @Column({ length: 10, default: 'OPEN' })
  status: CashStatus;

  @Column({ type: 'int', name: 'closed_by', nullable: true })
  closedBy: number | null;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt: Date | null;

  @CreateDateColumn({ name: 'opened_at', type: 'timestamptz' })
  openedAt: Date;
}
