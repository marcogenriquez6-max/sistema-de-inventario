import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryCustomerDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Texto libre: nombre, código o documento',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ description: '1 = solo activos' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  isActive?: number;
}
