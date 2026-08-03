import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UsersService } from '../users/users.service';
import { Public } from '../../common/decorators/public.decorator';
import {
  CurrentUser,
  AuthUser,
} from '../../common/decorators/current-user.decorator';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Iniciar sesión (obtiene access + refresh)' })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, req);
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Rotar refresh token (nuevo par de tokens)' })
  async refresh(@Body() dto: RefreshDto, @Req() req: Request) {
    return this.authService.refresh(dto.refreshToken, req);
  }

  @Post('logout')
  @HttpCode(204)
  @ApiOperation({ summary: 'Cerrar sesión (revoca el refresh token)' })
  async logout(@Body() dto: RefreshDto) {
    await this.authService.logout(dto.refreshToken);
  }

  @Post('change-password')
  @HttpCode(204)
  @ApiOperation({ summary: 'Cambiar mi contraseña' })
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser() user: AuthUser,
  ) {
    await this.usersService.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
    );
  }
}
