import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Ajuste o merma de stock con motivo justificado (RF-10).
 * ADJUST: corrección de inventario. MERMA: salida por daño/defecto.
 */
export class AdjustmentDto {
  @ApiProperty({ description: 'Id del producto' })
  @IsInt()
  @Min(1)
  productId: number;

  @ApiProperty({ enum: ['ADJUST', 'MERMA', 'RETURN'] })
  @IsIn(['ADJUST', 'MERMA', 'RETURN'])
  movementType: 'ADJUST' | 'MERMA' | 'RETURN';

  @ApiProperty({
    description: 'Cantidad. Positiva = entrada, negativa = salida',
  })
  @IsInt()
  quantity: number;

  @ApiPropertyOptional({ example: 'Repuesto dañado en almacén' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  concept?: string;
}
