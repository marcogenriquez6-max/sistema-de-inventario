import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BankAccount } from './bank-account.entity';
import { User } from '../users/user.entity';

export type BankMovementType =
  'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER_IN' | 'TRANSFER_OUT';

/**
 * Movimiento bancario: depósitos, retiros y transferencias.
 */
@Entity('bank_movements')
export class BankMovement {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ name: 'account_id' })
  accountId: number;

  @ManyToOne(() => BankAccount, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'account_id' })
  account: BankAccount;

  @Column({ name: 'movement_type', length: 15 })
  movementType: BankMovementType;

  @Column({ type: 'numeric', precision: 16, scale: 2 })
  amount: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  description: string | null;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
