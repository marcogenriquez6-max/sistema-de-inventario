import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDocumentDto {
  @ApiProperty({ example: 'factura-334455.pdf' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ enum: ['PDF', 'IMAGE', 'XLSX', 'DOCX', 'OTHER'] })
  @IsOptional()
  @IsIn(['PDF', 'IMAGE', 'XLSX', 'DOCX', 'OTHER'])
  fileType?: 'PDF' | 'IMAGE' | 'XLSX' | 'DOCX' | 'OTHER';

  @ApiPropertyOptional({ example: 'Compras' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @ApiPropertyOptional({ description: 'Ruta relativa del archivo' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  filePath?: string;

  @ApiPropertyOptional({ description: 'Tipo de entidad referenciada' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  referenceType?: string;

  @ApiPropertyOptional({ description: 'Id de la entidad referenciada' })
  @IsOptional()
  @IsInt()
  referenceId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
