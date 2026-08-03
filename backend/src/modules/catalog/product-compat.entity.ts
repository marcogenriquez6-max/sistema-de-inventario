import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from './product.entity';

/**
 * Compatibilidad de aplicación del repuesto con vehículos/equipos.
 * Evita el error de despacho de repuestos incorrectos (RF-02, RF-16).
 */
@Entity('product_compat')
export class ProductCompat {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ name: 'product_id' })
  productId: number;

  @ManyToOne(() => Product, (p) => p.compat, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Index()
  @Column({ name: 'vehicle_brand', length: 80 })
  vehicleBrand: string;

  @Index()
  @Column({ name: 'vehicle_model', length: 80 })
  vehicleModel: string;

  @Column({ name: 'year_from', type: 'int', nullable: true })
  yearFrom: number | null;

  @Column({ name: 'year_to', type: 'int', nullable: true })
  yearTo: number | null;

  @Column({ type: 'varchar', name: 'engine_type', length: 80, nullable: true })
  engineType: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
