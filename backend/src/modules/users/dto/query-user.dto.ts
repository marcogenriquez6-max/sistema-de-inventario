import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { Role } from '../../../common/decorators/roles.decorator';

export class QueryUserDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: ['ADMIN', 'SELLER', 'INVENTORY_MANAGER', 'MANAGER', 'AUDITOR'],
  })
  @IsOptional()
  @IsIn(['ADMIN', 'SELLER', 'INVENTORY_MANAGER', 'MANAGER', 'AUDITOR'])
  role?: Role;

  @ApiPropertyOptional({ description: 'Solo usuarios activos' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  isActive?: number;
}
