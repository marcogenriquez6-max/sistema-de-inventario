import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBankAccountDto {
  @ApiProperty({ example: 'CTA Operativa' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name: string;

  @ApiProperty({ example: 'Banco Unión' })
  @IsString()
  @MaxLength(100)
  bank: string;

  @ApiPropertyOptional({ enum: ['SAVINGS', 'CHECKING', 'FIXED'] })
  @IsOptional()
  @IsIn(['SAVINGS', 'CHECKING', 'FIXED'])
  accountType?: 'SAVINGS' | 'CHECKING' | 'FIXED';

  @ApiPropertyOptional({ example: '1000001234567' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  accountNumber?: string;

  @ApiPropertyOptional({ example: 'BOB' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiPropertyOptional({ description: 'Saldo inicial' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  balance?: number;
}

export class BankMovementDto {
  @ApiProperty({ enum: ['DEPOSIT', 'WITHDRAWAL'] })
  @IsIn(['DEPOSIT', 'WITHDRAWAL'])
  movementType: 'DEPOSIT' | 'WITHDRAWAL';

  @ApiProperty({ example: 500.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ example: 'Depósito cliente' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;
}

export class TransferDto {
  @ApiProperty({ description: 'Cuenta destino' })
  @IsInt()
  @Min(1)
  toAccountId: number;

  @ApiProperty({ example: 200.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ example: 'Traspaso a caja' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;
}
