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
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class JournalLineDto {
  @ApiProperty({ description: 'Id de la cuenta' })
  @IsInt()
  @Min(1)
  accountId: number;

  @ApiProperty({ description: 'Débito (0 si es solo crédito)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  debit: number;

  @ApiProperty({ description: 'Crédito (0 si es solo débito)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  credit: number;
}

export class CreateJournalEntryDto {
  @ApiProperty({
    example: '2026-08-03',
    description: 'Fecha del asiento (YYYY-MM-DD)',
  })
  @IsString()
  date: string;

  @ApiPropertyOptional({ example: 'Asiento de venta FAC-00001' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({ example: 'SALE' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  referenceType?: string;

  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  referenceId?: string;

  @ApiProperty({
    type: [JournalLineDto],
    minItems: 2,
    description: 'Debe cuadrar: suma débitos = suma créditos',
  })
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => JournalLineDto)
  lines: JournalLineDto[];
}

export class CreateAccountDto {
  @ApiProperty({ example: '1101' })
  @IsString()
  @MaxLength(20)
  code: string;

  @ApiProperty({ example: 'Caja General' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name: string;

  @ApiProperty({ enum: ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] })
  @IsString()
  @MaxLength(15)
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

  @ApiPropertyOptional({ description: 'Id de cuenta padre' })
  @IsOptional()
  @IsInt()
  parentId?: number;
}
