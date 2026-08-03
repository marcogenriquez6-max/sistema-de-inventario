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
  @ApiProperty({ example: 'FA-001' })
  @IsString()
  @MaxLength(50)
  sku: string;

  @ApiPropertyOptional({ example: '15400-PLM-A02' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  oemCode?: string;

  @ApiPropertyOptional({ example: '7501234560017' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  barcode?: string;

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

  @ApiPropertyOptional({ example: 'A', description: 'Pasillo' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  warehouseAisle?: string;

  @ApiPropertyOptional({ example: '1', description: 'Estantería' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  warehouseShelf?: string;

  @ApiPropertyOptional({ example: '2', description: 'Nivel' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  warehouseLevel?: string;

  @ApiPropertyOptional({ example: '1', description: 'Casilla' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  warehouseBin?: string;

  @ApiPropertyOptional({ type: [CompatEntryDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompatEntryDto)
  compat?: CompatEntryDto[];
}

export { CompatEntryDto };
