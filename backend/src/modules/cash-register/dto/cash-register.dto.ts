import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OpenRegisterDto {
  @ApiProperty({ example: 200.0, description: 'Saldo inicial en caja' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  initialBalance: number;
}

export class CashMovementDto {
  @ApiProperty({ enum: ['INCOME', 'EXPENSE', 'DEPOSIT', 'WITHDRAWAL'] })
  @IsIn(['INCOME', 'EXPENSE', 'DEPOSIT', 'WITHDRAWAL'])
  movementType: 'INCOME' | 'EXPENSE' | 'DEPOSIT' | 'WITHDRAWAL';

  @ApiProperty({ example: 50.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ example: 'Pago de luz' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;
}

export class CloseRegisterDto {
  @ApiProperty({ example: 1250.75, description: 'Conteo físico de la caja' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  countedAmount: number;
}
