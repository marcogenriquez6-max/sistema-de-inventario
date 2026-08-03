import {
  IsBoolean,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'EMP-00001' })
  @IsString()
  @MaxLength(30)
  code: string;

  @ApiProperty({ example: 'Ana Condori' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  fullName: string;

  @ApiPropertyOptional({ example: '1234567 LP' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  documentNumber?: string;

  @ApiPropertyOptional({ example: 'Vendedora' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  position?: string;

  @ApiPropertyOptional({ example: 'Ventas' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  department?: string;

  @ApiPropertyOptional({ example: '+591 70022334' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ example: 'ana@empresa.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;

  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsOptional()
  @IsString()
  hireDate?: string;

  @ApiPropertyOptional({ example: 3500.0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  salary?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {}
