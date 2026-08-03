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
 * Proveedor. Referenciado por documentos de compra y reposición de inventario.
 */
@Entity('suppliers')
export class Supplier {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'PROV-00001' })
  @Column({ length: 30, unique: true })
  code: string;

  @ApiProperty({ example: 'Distribuidora Autopartes S.A.' })
  @Index()
  @Column({ length: 200 })
  name: string;

  @ApiPropertyOptional({ example: '123456789012' })
  @Column({ type: 'varchar', name: 'tax_id', length: 30, nullable: true })
  taxId: string | null;

  @ApiPropertyOptional({ example: 'ventas@autopartes.com' })
  @Column({ type: 'varchar', length: 150, nullable: true })
  email: string | null;

  @ApiPropertyOptional({ example: '+591 70011223' })
  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  @ApiPropertyOptional()
  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | null;

  @ApiPropertyOptional({ default: true })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
