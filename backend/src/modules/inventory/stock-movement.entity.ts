import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from '../catalog/product.entity';
import { User } from '../users/user.entity';

export type MovementType = 'PURCHASE' | 'SALE' | 'ADJUST' | 'MERMA' | 'RETURN';

/**
 * Kardex: movimiento de stock con trazabilidad completa.
 * quién, cuándo, por qué concepto entró o salió cada unidad (RF-13).
 */
@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ name: 'product_id' })
  productId: number;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'movement_type', length: 20 })
  movementType: MovementType;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ name: 'unit_cost', type: 'numeric', precision: 14, scale: 2 })
  unitCost: string;

  @Column({ name: 'unit_base', type: 'numeric', precision: 14, scale: 2 })
  unitBase: string;

  @Column({ name: 'unit_sale', type: 'numeric', precision: 14, scale: 2 })
  unitSale: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  concept: string | null;

  @Column({
    type: 'varchar',
    name: 'reference_type',
    length: 30,
    nullable: true,
  })
  referenceType: string | null;

  @Column({ name: 'reference_id', type: 'bigint', nullable: true })
  referenceId: string | null;

  @Column({ type: 'int', name: 'user_id', nullable: true })
  userId: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Index()
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
