import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoomDto {
  @ApiProperty({ enum: ['direct', 'group', 'announcement'] })
  @IsIn(['direct', 'group', 'announcement'])
  type: 'direct' | 'group' | 'announcement';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @ApiProperty({ type: [Number], example: [2, 3] })
  @IsArray()
  @ArrayNotEmpty()
  participantIds: number[];
}

export class SendMessageDto {
  @ApiProperty({ example: 'Hola equipo' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;
}
