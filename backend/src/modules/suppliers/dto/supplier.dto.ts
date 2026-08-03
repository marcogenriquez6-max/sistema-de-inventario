import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';

export class CreateSupplierDto {
  @ApiProperty({ example: 'PROV-00001' })
  @IsString()
  @MaxLength(30)
  code: string;

  @ApiProperty({ example: 'Distribuidora Autopartes S.A.' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: '123456789012' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  taxId?: string;

  @ApiPropertyOptional({ example: 'ventas@autopartes.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;

  @ApiPropertyOptional({ example: '+591 70011223' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateSupplierDto extends PartialType(CreateSupplierDto) {}
