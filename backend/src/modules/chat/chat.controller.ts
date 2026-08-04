import {
  Body,
  Controller,
  Get,
  MessageEvent,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Sse,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { ChatService } from './chat.service';
import { CreateRoomDto, SendMessageDto } from './dto/chat.dto';
import {
  CurrentUser,
  AuthUser,
} from '../../common/decorators/current-user.decorator';
import { RequireModule } from '../../common/decorators/require-module.decorator';

@ApiTags('Chat')
@RequireModule('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get('rooms')
  @ApiOperation({ summary: 'Salas del usuario con último mensaje y no leídos' })
  rooms(@CurrentUser() user: AuthUser) {
    return this.chat.listRooms(user.id);
  }

  @Post('rooms')
  @ApiOperation({ summary: 'Crear sala directa, grupal o anuncio' })
  createRoom(@CurrentUser() user: AuthUser, @Body() dto: CreateRoomDto) {
    return this.chat.createRoom(user.id, dto);
  }

  @Get('rooms/:id')
  @ApiOperation({ summary: 'Detalle de una sala' })
  room(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.chat.room(user.id, id);
  }

  @Get('rooms/:id/messages')
  @ApiOperation({ summary: 'Historial de mensajes de una sala' })
  messages(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Query('afterId') afterId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.chat.getMessages(
      user.id,
      id,
      afterId !== undefined ? parseInt(afterId, 10) : undefined,
      Math.min(Math.max(parseInt(limit ?? '50', 10) || 50, 1), 200),
    );
  }

  @Post('rooms/:id/messages')
  @ApiOperation({ summary: 'Enviar mensaje en una sala' })
  sendMessage(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SendMessageDto,
  ) {
    return this.chat.sendMessage(user.id, id, dto.content);
  }

  @Post('rooms/:id/read')
  @ApiOperation({ summary: 'Marcar sala como leída' })
  async markRead(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.chat.markRead(user.id, id);
    return { ok: true };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Mensajes sin leer en todas las salas' })
  unreadCount(@CurrentUser() user: AuthUser) {
    return this.chat.unreadCount(user.id);
  }

  @Get('users')
  @ApiOperation({ summary: 'Usuarios activos para iniciar un chat' })
  availableUsers(@CurrentUser() user: AuthUser, @Query('q') q?: string) {
    return this.chat.availableUsers(user.id, q);
  }

  @Sse('stream')
  @ApiOperation({ summary: 'Stream SSE de mensajes del chat' })
  stream(@CurrentUser() user: AuthUser): Observable<MessageEvent> {
    return this.chat.stream(user.id);
  }
}
