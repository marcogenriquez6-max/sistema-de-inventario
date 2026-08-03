import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QuerySaleDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ['NOTA', 'FACTURA'] })
  @IsOptional()
  @IsIn(['NOTA', 'FACTURA'])
  docType?: 'NOTA' | 'FACTURA';

  @ApiPropertyOptional({ enum: ['COMPLETED', 'VOIDED'] })
  @IsOptional()
  @IsIn(['COMPLETED', 'VOIDED'])
  status?: 'COMPLETED' | 'VOIDED';

  @ApiPropertyOptional({ example: '2026-08-01' })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-08-31' })
  @IsOptional()
  @IsString()
  to?: string;

  @ApiPropertyOptional({ description: 'Número de documento o cliente' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;
}
