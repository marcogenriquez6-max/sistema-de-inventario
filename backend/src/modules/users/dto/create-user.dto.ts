import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../../common/decorators/roles.decorator';

export class CreateUserDto {
  @ApiProperty({ example: 'vendedor@sistema.com' })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: 'Maria Vendedora' })
  @IsString()
  @MaxLength(150)
  fullName: string;

  @ApiProperty({ example: 'Password@123' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @ApiProperty({
    enum: ['ADMIN', 'SELLER', 'INVENTORY_MANAGER', 'MANAGER', 'AUDITOR'],
  })
  @IsIn(['ADMIN', 'SELLER', 'INVENTORY_MANAGER', 'MANAGER', 'AUDITOR'])
  role: Role;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
