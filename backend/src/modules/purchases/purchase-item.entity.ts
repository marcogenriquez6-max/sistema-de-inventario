import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from '../catalog/product.entity';
import { PurchaseDocument } from './purchase-document.entity';

/**
 * Línea de compra. Congela el costo de adquisición del momento (histórico).
 */
@Entity('purchase_items')
export class PurchaseItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ name: 'purchase_id' })
  purchaseId: number;

  @ManyToOne(() => PurchaseDocument, (d) => d.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchase_id' })
  purchase: PurchaseDocument;

  @Index()
  @Column({ name: 'product_id' })
  productId: number;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'product_sku', length: 50 })
  productSku: string;

  @Column({ name: 'product_name', length: 200 })
  productName: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ name: 'unit_cost', type: 'numeric', precision: 14, scale: 2 })
  unitCost: string;

  @Column({ name: 'line_total', type: 'numeric', precision: 14, scale: 2 })
  lineTotal: string;
}
