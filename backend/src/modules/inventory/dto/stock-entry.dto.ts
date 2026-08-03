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
import { ApiProperty } from '@nestjs/swagger';

export class StockEntryItemDto {
  @ApiProperty({ description: 'Id del producto' })
  @IsInt()
  @Min(1)
  productId: number;

  @ApiProperty({ example: 50, description: 'Cantidad entrante' })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 10.0, description: 'Costo unitario de la compra' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitCost: number;
}

/**
 * Entrada de stock por compra (RF-06). Recalcula automáticamente el PVP
 * sugerido si cambia el costo (margen global configurado).
 */
export class StockEntryDto {
  @ApiProperty({ example: 'Compra proveedor #456' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  concept?: string;

  @ApiProperty({ type: [StockEntryItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StockEntryItemDto)
  items: StockEntryItemDto[];
}
