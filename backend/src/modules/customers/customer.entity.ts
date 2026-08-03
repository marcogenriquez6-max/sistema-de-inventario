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
 * Cliente del negocio. Referenciado por documentos de venta y gestión comercial.
 */
@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'CLI-00001' })
  @Column({ length: 30, unique: true })
  code: string;

  @ApiProperty({ example: 'Juan Pérez' })
  @Index()
  @Column({ length: 200 })
  name: string;

  @ApiPropertyOptional({ example: 'CI', enum: ['CI', 'RUC', 'PASSPORT'] })
  @Column({
    type: 'varchar',
    name: 'document_type',
    length: 10,
    nullable: true,
  })
  documentType: string | null;

  @ApiPropertyOptional({ example: '12345678' })
  @Index()
  @Column({
    type: 'varchar',
    name: 'document_number',
    length: 30,
    nullable: true,
  })
  documentNumber: string | null;

  @ApiPropertyOptional({ example: 'cliente@correo.com' })
  @Column({ type: 'varchar', length: 150, nullable: true })
  email: string | null;

  @ApiPropertyOptional({ example: '+591 71234567' })
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
