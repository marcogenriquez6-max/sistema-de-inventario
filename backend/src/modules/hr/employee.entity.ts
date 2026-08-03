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
 * Empleado. Módulo RR.HH. básico: ficha, puesto, departamento y estado.
 */
@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'EMP-00001' })
  @Column({ length: 30, unique: true })
  code: string;

  @ApiProperty({ example: 'Ana Condori' })
  @Index()
  @Column({ name: 'full_name', length: 150 })
  fullName: string;

  @ApiPropertyOptional({ example: '1234567 LP' })
  @Column({
    type: 'varchar',
    name: 'document_number',
    length: 30,
    nullable: true,
  })
  documentNumber: string | null;

  @ApiPropertyOptional({ example: 'Vendedora' })
  @Column({ type: 'varchar', length: 80, nullable: true })
  position: string | null;

  @ApiPropertyOptional({ example: 'Ventas' })
  @Column({ type: 'varchar', length: 80, nullable: true })
  department: string | null;

  @ApiPropertyOptional({ example: '+591 70022334' })
  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  @ApiPropertyOptional({ example: 'ana@empresa.com' })
  @Column({ type: 'varchar', length: 150, nullable: true })
  email: string | null;

  @ApiPropertyOptional({ example: '2024-01-15' })
  @Column({ name: 'hire_date', type: 'date', nullable: true })
  hireDate: string | null;

  @ApiPropertyOptional({ example: 3500.0 })
  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  salary: string | null;

  @ApiPropertyOptional({ default: true })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
