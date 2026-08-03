import { IsJWT } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshDto {
  @ApiProperty({ description: 'Refresh token emitido en el login' })
  @IsJWT()
  refreshToken: string;
}
