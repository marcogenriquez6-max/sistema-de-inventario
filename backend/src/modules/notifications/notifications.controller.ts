import {
  Body,
  Controller,
  Get,
  MessageEvent,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Sse,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { NotificationsService } from './notifications.service';
import { FcmService } from './fcm.service';
import {
  CurrentUser,
  AuthUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireModule } from '../../common/decorators/require-module.decorator';

@ApiTags('Notificaciones')
@RequireModule('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly fcm: FcmService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar notificaciones del usuario (paginado)' })
  async list(
    @CurrentUser() user: AuthUser,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.notifications.list(
      user.id,
      Math.max(parseInt(page ?? '1', 10) || 1, 1),
      Math.min(Math.max(parseInt(pageSize ?? '20', 10) || 20, 1), 100),
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Cantidad de notificaciones sin leer' })
  async unreadCount(@CurrentUser() user: AuthUser) {
    return this.notifications.unreadCount(user.id);
  }

  @Sse('stream')
  @ApiOperation({ summary: 'Stream SSE en tiempo real de notificaciones' })
  stream(@CurrentUser() user: AuthUser): Observable<MessageEvent> {
    return this.notifications.stream(user.id);
  }

  @Patch('read/:id')
  @ApiOperation({ summary: 'Marcar una notificación como leída' })
  async markRead(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.notifications.markRead(user.id, id);
    return { ok: true };
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Marcar todas como leídas' })
  async markAllRead(@CurrentUser() user: AuthUser) {
    await this.notifications.markAllRead(user.id);
    return { ok: true };
  }

  @Post('fcm-token')
  @ApiOperation({
    summary: 'Registrar token de push (Firebase Cloud Messaging)',
  })
  async registerFcmToken(
    @CurrentUser() user: AuthUser,
    @Body() body: { token: string; device?: string },
  ) {
    if (!body?.token) return { ok: false, error: 'token requerido' };
    await this.fcm.register(user.id, body.token, body.device);
    return { ok: true };
  }

  @Post('fcm-token/remove')
  @ApiOperation({ summary: 'Eliminar token de push' })
  async removeFcmToken(
    @CurrentUser() user: AuthUser,
    @Body() body: { token: string },
  ) {
    if (!body?.token) return { ok: false, error: 'token requerido' };
    await this.fcm.remove(user.id, body.token);
    return { ok: true };
  }

  @Post('test')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Crear una notificación de prueba (admin)' })
  async test(@CurrentUser() user: AuthUser, @Body('message') message?: string) {
    return this.notifications.create(
      user.id,
      'TEST',
      'Notificación de prueba',
      message ??
        'Esto es una prueba del centro de notificaciones en tiempo real.',
      { demo: true },
    );
  }
}
