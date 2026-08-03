import { Type } from 'class-transformer';
import {
  ArrayMinSize,
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

export class PurchaseItemDto {
  @ApiProperty({ description: 'Id del producto' })
  @IsInt()
  @Min(1)
  productId: number;

  @ApiProperty({ example: 20 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 10.0, description: 'Costo unitario de la compra' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitCost: number;
}

/**
 * Registro de compra. Actualiza inventario, costos, PVP sugerido y Kardex
 * en una única transacción atómica.
 */
export class CreatePurchaseDto {
  @ApiProperty({ description: 'Id del proveedor' })
  @IsInt()
  @Min(1)
  supplierId: number;

  @ApiPropertyOptional({ example: 'FAC-334455' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  invoiceNumber?: string;

  @ApiProperty({ type: [PurchaseItemDto], minItems: 1 })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDto)
  items: PurchaseItemDto[];
}
