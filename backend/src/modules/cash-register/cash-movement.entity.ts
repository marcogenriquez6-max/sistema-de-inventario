import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CashRegister } from './cash-register.entity';
import { User } from '../users/user.entity';

export type CashMovementType = 'INCOME' | 'EXPENSE' | 'DEPOSIT' | 'WITHDRAWAL';

/**
 * Movimiento de caja: ingresos (ventas, cobros) y egresos (gastos, retiros,
 * depósitos). Mantiene la expectativa de saldo de la caja abierta.
 */
@Entity('cash_movements')
export class CashMovement {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ name: 'register_id' })
  registerId: number;

  @ManyToOne(() => CashRegister, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'register_id' })
  register: CashRegister;

  @Column({ name: 'movement_type', length: 15 })
  movementType: CashMovementType;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  description: string | null;

  @Column({
    type: 'varchar',
    name: 'reference_type',
    length: 30,
    nullable: true,
  })
  referenceType: string | null;

  @Column({ name: 'reference_id', type: 'bigint', nullable: true })
  referenceId: string | null;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
