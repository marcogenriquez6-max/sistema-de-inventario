import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type AccountType =
  'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

/**
 * Cuenta del plan contable. Modelo jerárquico simple con código alfanumérico
 * (ej: 1 = Activo, 11 = Caja y Bancos, 1101 = Caja General).
 */
@Entity('chart_of_accounts')
export class Account {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: '1101' })
  @Column({ length: 20, unique: true })
  code: string;

  @ApiProperty({ example: 'Caja General' })
  @Column({ length: 150 })
  name: string;

  @ApiProperty({ enum: ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] })
  @Index()
  @Column({ length: 15 })
  type: AccountType;

  @ApiPropertyOptional({ description: 'Cuenta padre (jerarquía)' })
  @Column({ type: 'int', name: 'parent_id', nullable: true })
  parentId: number | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
