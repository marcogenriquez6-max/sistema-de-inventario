import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductCode } from './product-code.entity';
import { ProductCompat } from './product-compat.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'FA-001' })
  @Column({ length: 50, unique: true })
  sku: string;

  @ApiPropertyOptional({ example: '15400-PLM-A02' })
  @Column({
    type: 'varchar',
    name: 'oem_code',
    length: 50,
    nullable: true,
    unique: true,
  })
  oemCode: string | null;

  @ApiProperty({ example: 'Filtro de Aceite PH-6607' })
  @Index()
  @Column({ length: 200 })
  name: string;

  @ApiPropertyOptional({ example: 'Filtros' })
  @Index()
  @Column({ type: 'varchar', length: 80, nullable: true })
  category: string | null;

  @ApiPropertyOptional({ example: 'Honda' })
  @Index()
  @Column({ type: 'varchar', length: 80, nullable: true })
  brand: string | null;

  @ApiPropertyOptional({ default: 'uds' })
  @Column({ length: 20, default: 'uds' })
  unit: string;

  @ApiProperty({
    example: 20,
    description: 'Existencia actual (nunca negativa)',
  })
  @Column({ default: 0 })
  stock: number;

  @ApiProperty({ example: 5, description: 'Umbral de reposición' })
  @Column({ name: 'min_stock', default: 0 })
  minStock: number;

  @ApiProperty({ example: 10.0, description: 'Precio de compra (costo)' })
  @Column({
    name: 'cost_price',
    type: 'numeric',
    precision: 14,
    scale: 2,
    default: 0,
  })
  costPrice: string;

  @ApiProperty({ example: 15.0, description: 'PVP sin IVA' })
  @Column({
    name: 'base_price',
    type: 'numeric',
    precision: 14,
    scale: 2,
    default: 0,
  })
  basePrice: string;

  @ApiProperty({ example: 17.4, description: 'PVP con IVA' })
  @Column({
    name: 'sale_price',
    type: 'numeric',
    precision: 14,
    scale: 2,
    default: 0,
  })
  salePrice: string;

  @ApiPropertyOptional()
  @Column({ type: 'varchar', name: 'image_url', length: 300, nullable: true })
  imageUrl: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => ProductCode, (c) => c.product, {
    cascade: true,
    eager: true,
  })
  codes: ProductCode[];

  @OneToMany(() => ProductCompat, (c) => c.product, { cascade: true })
  compat: ProductCompat[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
