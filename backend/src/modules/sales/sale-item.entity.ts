import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from '../catalog/product.entity';
import { SaleDocument } from './sale-document.entity';

/**
 * Detalle de venta con precios congelados (RF-14). Ningún cambio posterior
 * de costo o impuesto altera los valores de este registro.
 */
@Entity('sale_items')
export class SaleItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ name: 'sale_id' })
  saleId: number;

  @ManyToOne(() => SaleDocument, (d) => d.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_id' })
  sale: SaleDocument;

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

  @Column({ name: 'unit_base', type: 'numeric', precision: 14, scale: 2 })
  unitBase: string;

  @Column({ name: 'unit_sale', type: 'numeric', precision: 14, scale: 2 })
  unitSale: string;

  @Column({ name: 'tax_rate', type: 'numeric', precision: 5, scale: 2 })
  taxRate: string;

  @Column({ name: 'tax_amount', type: 'numeric', precision: 14, scale: 2 })
  taxAmount: string;

  @Column({ name: 'line_total', type: 'numeric', precision: 14, scale: 2 })
  lineTotal: string;
}
