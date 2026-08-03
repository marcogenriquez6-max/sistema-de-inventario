import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Cuenta bancaria de la empresa. Fuente de tesorería.
 */
@Entity('bank_accounts')
export class BankAccount {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'BANCO UNIÓN CTA 001' })
  @Column({ length: 150 })
  name: string;

  @ApiProperty({ example: 'Banco Unión' })
  @Index()
  @Column({ length: 100 })
  bank: string;

  @ApiPropertyOptional({
    example: 'SAVINGS',
    enum: ['SAVINGS', 'CHECKING', 'FIXED'],
  })
  @Column({ name: 'account_type', length: 15, default: 'SAVINGS' })
  accountType: string;

  @ApiPropertyOptional({ example: '1000001234567' })
  @Column({
    type: 'varchar',
    name: 'account_number',
    length: 50,
    nullable: true,
  })
  accountNumber: string | null;

  @ApiPropertyOptional({ example: 'BOB' })
  @Column({ length: 10, default: 'BOB' })
  currency: string;

  @ApiProperty({ description: 'Saldo actual' })
  @Column({ type: 'numeric', precision: 16, scale: 2, default: '0' })
  balance: string;

  @ApiPropertyOptional({ default: true })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
