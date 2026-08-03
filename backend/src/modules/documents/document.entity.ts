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
 * Gestión documental: metadatos de archivos del negocio
 * (facturas escaneadas, contratos, manuales). Los archivos se sirven
 * desde el volumen de NGINX; aquí se registra la referencia.
 */
@Entity('documents')
export class DocumentRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'factura-334455.pdf' })
  @Column({ length: 255 })
  name: string;

  @ApiPropertyOptional({
    example: 'PDF',
    enum: ['PDF', 'IMAGE', 'XLSX', 'DOCX', 'OTHER'],
  })
  @Column({ name: 'file_type', length: 20, default: 'OTHER' })
  fileType: string;

  @ApiPropertyOptional({ example: 'Compras' })
  @Index()
  @Column({ type: 'varchar', length: 80, nullable: true })
  category: string | null;

  @ApiPropertyOptional({ description: 'Ruta dentro del volumen de archivos' })
  @Column({ type: 'varchar', name: 'file_path', length: 500, nullable: true })
  filePath: string | null;

  @ApiPropertyOptional({
    description: 'Entidad referenciada: SALE/PURCHASE/EMPLOYEE/OTHER',
  })
  @Column({
    type: 'varchar',
    name: 'reference_type',
    length: 30,
    nullable: true,
  })
  referenceType: string | null;

  @Column({ name: 'reference_id', type: 'bigint', nullable: true })
  referenceId: string | null;

  @Column({ type: 'int', name: 'uploaded_by', nullable: true })
  uploadedBy: number | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
