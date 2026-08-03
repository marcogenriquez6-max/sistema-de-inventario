import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../../common/decorators/roles.decorator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Maria Vendedora' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  fullName?: string;

  @ApiPropertyOptional({ example: 'Password@123' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password?: string;

  @ApiPropertyOptional({
    enum: ['ADMIN', 'SELLER', 'INVENTORY_MANAGER', 'MANAGER', 'AUDITOR'],
  })
  @IsOptional()
  @IsIn(['ADMIN', 'SELLER', 'INVENTORY_MANAGER', 'MANAGER', 'AUDITOR'])
  role?: Role;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
