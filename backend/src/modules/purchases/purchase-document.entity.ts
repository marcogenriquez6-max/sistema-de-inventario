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
import { Supplier } from '../suppliers/supplier.entity';
import { PurchaseItem } from './purchase-item.entity';

export type PurchaseStatus = 'RECEIVED' | 'VOIDED';

/**
 * Cabecera de documento de compra a proveedor. Cada compra actualiza el
 * inventario (stock + costo + PVP sugerido) y registra movimientos de Kardex.
 */
@Entity('purchase_documents')
export class PurchaseDocument {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'doc_number', length: 30, unique: true })
  docNumber: string;

  @Index()
  @Column({ name: 'supplier_id' })
  supplierId: number;

  @ManyToOne(() => Supplier, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Column({ name: 'supplier_name', length: 200 })
  supplierName: string;

  @Column({
    type: 'varchar',
    name: 'invoice_number',
    length: 50,
    nullable: true,
  })
  invoiceNumber: string | null;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  subtotal: string;

  @Column({ name: 'tax_rate', type: 'numeric', precision: 5, scale: 2 })
  taxRate: string;

  @Column({ name: 'tax_amount', type: 'numeric', precision: 14, scale: 2 })
  taxAmount: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  total: string;

  @Column({ length: 20, default: 'RECEIVED' })
  status: PurchaseStatus;

  @Column({ type: 'varchar', name: 'void_reason', length: 200, nullable: true })
  voidReason: string | null;

  @Column({ name: 'user_id' })
  userId: number;

  @OneToMany(() => PurchaseItem, (i) => i.purchase, { cascade: true })
  items: PurchaseItem[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
