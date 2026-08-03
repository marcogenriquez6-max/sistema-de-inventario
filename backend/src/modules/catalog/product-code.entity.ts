import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from './product.entity';

export type CodeType = 'OEM' | 'BARCODE' | 'SKU_ALT';

/**
 * Códigos alternativos del repuesto (multicódigo). Permite buscar por
 * OEM, código de barras o SKU alternativo sin romper la unicidad de
 * products.sku/oem_code/barcode.
 */
@Entity('product_codes')
export class ProductCode {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'product_id' })
  productId: number;

  @ManyToOne(() => Product, (p) => p.codes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'code_type', length: 20 })
  codeType: CodeType;

  @Column({ name: 'code_value', length: 50 })
  codeValue: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
