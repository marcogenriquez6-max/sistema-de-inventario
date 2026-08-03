import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

/**
 * Filtros de búsqueda del catálogo. El campo `q` busca por SKU, OEM,
 * código de barras o nombre; los demás filtros restringen la lista.
 */
export class QueryProductDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Texto libre: SKU, OEM, código de barras o nombre',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ example: 'Honda' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  brand?: string;

  @ApiPropertyOptional({ example: 'Frenos' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @ApiPropertyOptional({ description: 'Marca del vehículo (compatibilidad)' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  vehicleBrand?: string;

  @ApiPropertyOptional({ description: 'Modelo del vehículo (compatibilidad)' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  vehicleModel?: string;

  @ApiPropertyOptional({ description: 'Año del vehículo' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;

  @ApiPropertyOptional({ description: '1 = solo stock bajo mínimo' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  lowStock?: number;
}
