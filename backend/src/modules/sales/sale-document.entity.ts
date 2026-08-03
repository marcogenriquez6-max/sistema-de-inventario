import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '../users/user.entity';
import { SaleItem } from './sale-item.entity';

export type DocType = 'NOTA' | 'FACTURA';
export type DocStatus = 'COMPLETED' | 'VOIDED';

/**
 * Cabecera de documento de venta (Nota de Venta/Entrega o Factura).
 * El correlativo (doc_number) es único: se asigna dentro de la transacción
 * atómica para evitar duplicados bajo concurrencia.
 */
@Entity('sale_documents')
export class SaleDocument {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ enum: ['NOTA', 'FACTURA'] })
  @Column({ name: 'doc_type', length: 20 })
  docType: DocType;

  @ApiProperty({ example: 'FAC-00001' })
  @Column({ name: 'doc_number', length: 30, unique: true })
  docNumber: string;

  @ApiProperty({ example: 'Cliente General' })
  @Column({ name: 'customer_name', length: 200 })
  customerName: string;

  @ApiPropertyOptional({ example: '12345678' })
  @Column({ type: 'varchar', name: 'customer_doc', length: 30, nullable: true })
  customerDoc: string | null;

  @ApiProperty({ example: 42.0 })
  @Column({ type: 'numeric', precision: 14, scale: 2 })
  subtotal: string;

  @ApiProperty({ example: 16.0 })
  @Column({ name: 'tax_rate', type: 'numeric', precision: 5, scale: 2 })
  taxRate: string;

  @ApiProperty({ example: 6.72 })
  @Column({ name: 'tax_amount', type: 'numeric', precision: 14, scale: 2 })
  taxAmount: string;

  @ApiProperty({ example: 48.72 })
  @Column({ type: 'numeric', precision: 14, scale: 2 })
  total: string;

  @Column({ length: 20, default: 'COMPLETED' })
  status: DocStatus;

  @Column({ type: 'varchar', name: 'void_reason', length: 200, nullable: true })
  voidReason: string | null;

  @Index()
  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => SaleItem, (i) => i.sale, { cascade: true })
  items: SaleItem[];

  @Index()
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
