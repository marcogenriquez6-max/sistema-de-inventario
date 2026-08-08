import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CompatEntryDto {
  @ApiProperty({ example: 'Honda' })
  @IsString()
  @MaxLength(80)
  vehicleBrand: string;

  @ApiProperty({ example: 'Civic' })
  @IsString()
  @MaxLength(80)
  vehicleModel: string;

  @ApiPropertyOptional({ example: 2016 })
  @IsOptional()
  @IsInt()
  yearFrom?: number;

  @ApiPropertyOptional({ example: 2021 })
  @IsOptional()
  @IsInt()
  yearTo?: number;

  @ApiPropertyOptional({ example: '1.8L' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  engineType?: string;
}

export class CreateProductDto {
  @ApiPropertyOptional({
    example: 'FA-001',
    description: 'Código interno. Si se omite, se genera automáticamente.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  sku?: string;

  @ApiPropertyOptional({ example: '15400-PLM-A02' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  oemCode?: string;

  @ApiProperty({ example: 'Filtro de Aceite PH-6607' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 'Filtros' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @ApiPropertyOptional({ example: 'Honda' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  brand?: string;

  @ApiPropertyOptional({ example: 'Importado', description: 'Procedencia/origen' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  provenance?: string;

  @ApiPropertyOptional({ default: 'uds' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  unit?: string;

  @ApiProperty({ example: 10.0, description: 'Precio de compra (costo)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  costPrice: number;

  @ApiPropertyOptional({
    example: 15.0,
    description: 'PVP sin IVA. Si se omite, se calcula con el margen global.',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  basePrice?: number;

  @ApiPropertyOptional({
    example: 17.4,
    description:
      'PVP final con IVA. Si se omite, se calcula con la tasa de IVA vigente.',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  salePrice?: number;

  @ApiPropertyOptional({
    example: '/api/uploads/photo.jpg',
    description: 'URL de la foto del producto',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  imageUrl?: string;

  @ApiPropertyOptional({
    example: 5,
    description: 'Stock inicial (0 por defecto)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  @Min(0)
  minStock?: number;

  @ApiPropertyOptional({ type: [CompatEntryDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompatEntryDto)
  compat?: CompatEntryDto[];
}

export { CompatEntryDto };
