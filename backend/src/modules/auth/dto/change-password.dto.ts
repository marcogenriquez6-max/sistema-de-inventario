import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'Current@123' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  currentPassword: string;

  @ApiProperty({ example: 'New@456' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword: string;
}
