import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SaleItemDto {
  @ApiProperty({ description: 'Id del producto' })
  @IsInt()
  @Min(1)
  productId: number;

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  quantity: number;
}

/**
 * Creación de venta (POS). El backend ejecuta la transacción atómica:
 * valida stock, congela precios, descuenta existencias y registra Kardex.
 */
export class CreateSaleDto {
  @ApiProperty({ enum: ['NOTA', 'FACTURA'], default: 'NOTA' })
  @IsIn(['NOTA', 'FACTURA'])
  docType: 'NOTA' | 'FACTURA';

  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  customerName: string;

  @ApiPropertyOptional({ example: '12345678' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  customerDoc?: string;

  @ApiProperty({ type: [SaleItemDto], minItems: 1 })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];
}
