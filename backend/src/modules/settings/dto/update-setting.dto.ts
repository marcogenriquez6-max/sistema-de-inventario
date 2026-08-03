import { IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSettingDto {
  @ApiPropertyOptional({ description: 'Nuevo valor JSON del parámetro' })
  @IsObject()
  value: Record<string, unknown>;
}
