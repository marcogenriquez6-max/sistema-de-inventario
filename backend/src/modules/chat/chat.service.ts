import {
  BadRequestException,
  Injectable,
  Logger,
  MessageEvent,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { filter, map, Observable, Subject } from 'rxjs';
import { ChatRoom } from './chat-room.entity';
import { ChatRoomMember } from './chat-member.entity';
import { ChatMessage } from './chat-message.entity';
import { CreateRoomDto } from './dto/chat.dto';
import { NotificationsService } from '../notifications/notifications.service';

export interface ChatBusEvent {
  userId: number;
  roomId: number;
  message: ChatMessage;
}

export interface RoomView {
  id: number;
  type: string;
  name: string | null;
  createdAt: Date;
  lastMessage: string | null;
  lastMessageAt: Date | null;
  lastSender: string | null;
  unreadCount: number;
  participants: Array<{ id: number; name: string; role: string }>;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly bus = new Subject<ChatBusEvent>();

  constructor(
    @InjectRepository(ChatRoom)
    private readonly rooms: Repository<ChatRoom>,
    @InjectRepository(ChatRoomMember)
    private readonly members: Repository<ChatRoomMember>,
    @InjectRepository(ChatMessage)
    private readonly messages: Repository<ChatMessage>,
    private readonly dataSource: DataSource,
    private readonly notifications: NotificationsService,
  ) {}

  /** Salas en las que participa el usuario, con último mensaje y no leídos. */
  async listRooms(userId: number): Promise<RoomView[]> {
    const rows: RoomView[] = await this.dataSource.query(
      `SELECT r.id,
              r.type,
              r.name,
              r.created_at AS "createdAt",
              lm.content  AS "lastMessage",
              lm.created_at AS "lastMessageAt",
              lu.full_name  AS "lastSender",
              (SELECT count(*)
                 FROM chat_messages m
                WHERE m.room_id = r.id
                  AND m.created_at > cm.last_read_at) AS "unreadCount"
         FROM chat_rooms r
         JOIN chat_room_members cm ON cm.room_id = r.id
         LEFT JOIN LATERAL (
              SELECT content, created_at, sender_id
                FROM chat_messages
               WHERE room_id = r.id
               ORDER BY id DESC LIMIT 1
         ) lm ON TRUE
         LEFT JOIN users lu ON lu.id = lm.sender_id
        WHERE cm.user_id = $1
        ORDER BY COALESCE(lm.created_at, r.created_at) DESC`,
      [userId],
    );

    const participants = await this.dataSource.query(
      `SELECT m.room_id AS "roomId", u.id, u.full_name AS name, u.role
         FROM chat_room_members m
         JOIN users u ON u.id = m.user_id
        WHERE m.room_id = ANY($1)
        ORDER BY u.full_name`,
      [rows.map((r) => r.id)],
    );

    const byRoom = new Map<
      number,
      Array<{ id: number; name: string; role: string }>
    >();
    for (const p of participants as Array<{
      roomId: number;
      id: number;
      name: string;
      role: string;
    }>) {
      const list = byRoom.get(p.roomId) ?? [];
      list.push({ id: p.id, name: p.name, role: p.role });
      byRoom.set(p.roomId, list);
    }

    for (const r of rows) {
      r.participants = byRoom.get(r.id) ?? [];
    }
    return rows;
  }

  /** Crea una sala (direct/group/announcement) con sus miembros. */
  async createRoom(userId: number, dto: CreateRoomDto): Promise<RoomView> {
    const ids = Array.from(new Set([...dto.participantIds, userId]));

    const rows = await this.dataSource.query(
      `SELECT id, full_name FROM users WHERE id = ANY($1) AND is_active = TRUE`,
      [ids],
    );
    if (rows.length !== ids.length) {
      throw new BadRequestException(
        'Algunos participantes no existen o están inactivos',
      );
    }

    if (dto.type === 'direct' && dto.participantIds.length === 1) {
      const other = rows.find(
        (r: { id: number }) => r.id === dto.participantIds[0],
      );
      dto.name = other ? other.full_name : dto.name;
    }
    if (dto.type === 'group' && !dto.name) {
      dto.name = rows
        .filter((r: { id: number }) => r.id !== userId)
        .slice(0, 3)
        .map((r: { full_name: string }) => r.full_name.split(' ')[0])
        .join(', ');
    }

    const room = await this.rooms.save(
      this.rooms.create({
        type: dto.type,
        name: dto.name ?? null,
        createdBy: userId,
      }),
    );

    const members = ids.map((id) =>
      this.members.create({ roomId: room.id, userId: id }),
    );
    await this.members.save(members);

    const created = await this.listRooms(userId);
    return created.find((r) => Number(r.id) === room.id)!;
  }

  /** Historial de mensajes de una sala (solo si es miembro). */
  async getMessages(
    userId: number,
    roomId: number,
    afterId?: number,
    limit = 50,
  ): Promise<ChatMessage[]> {
    await this.assertMember(userId, roomId);
    const qb = this.messages
      .createQueryBuilder('m')
      .where('m.room_id = :roomId', { roomId })
      .orderBy('m.id', 'ASC')
      .take(Math.min(limit, 200));
    if (afterId !== undefined) {
      qb.andWhere('m.id > :afterId', { afterId });
    }
    return qb.getMany();
  }

  /** Envía un mensaje y lo emite a todos los miembros vía SSE + notificación. */
  async sendMessage(
    userId: number,
    roomId: number,
    content: string,
  ): Promise<ChatMessage> {
    await this.assertMember(userId, roomId);
    const saved = await this.messages.save(
      this.messages.create({ roomId, senderId: userId, content }),
    );

    const members = await this.members.find({ where: { roomId } });
    for (const m of members) {
      this.bus.next({ userId: m.userId, roomId, message: saved });
    }
    for (const m of members) {
      if (m.userId === userId) continue;
      await this.notifications.create(
        m.userId,
        'CHAT',
        'Nuevo mensaje',
        content.length > 140 ? `${content.slice(0, 140)}…` : content,
        { roomId },
      );
    }
    return saved;
  }

  /** Marca la sala como leída hasta ahora. */
  async markRead(userId: number, roomId: number): Promise<void> {
    await this.assertMember(userId, roomId);
    await this.dataSource.query(
      `UPDATE chat_room_members
          SET last_read_at = now()
        WHERE room_id = $1 AND user_id = $2`,
      [roomId, userId],
    );
  }

  /** Total de mensajes sin leer en todas las salas del usuario. */
  async unreadCount(userId: number): Promise<number> {
    const rows = await this.dataSource.query(
      `SELECT count(*)::int AS total
         FROM chat_messages m
         JOIN chat_room_members cm ON cm.room_id = m.room_id
        WHERE cm.user_id = $1
          AND m.sender_id <> $1
          AND m.created_at > cm.last_read_at`,
      [userId],
    );
    return rows[0]?.total ?? 0;
  }

  /** Usuarios activos disponibles para iniciar un chat (excluye al propio). */
  async availableUsers(
    userId: number,
    q?: string,
  ): Promise<Array<{ id: number; name: string; role: string }>> {
    const rows = await this.dataSource.query(
      `SELECT id, full_name AS name, role
         FROM users
        WHERE is_active = TRUE AND id <> $1
          AND (lower(full_name) LIKE lower($2) OR lower(email) LIKE lower($2))
        ORDER BY full_name
        LIMIT 20`,
      [userId, `%${q ?? ''}%`],
    );
    return rows;
  }

  async room(userId: number, roomId: number): Promise<RoomView> {
    await this.assertMember(userId, roomId);
    const rooms = await this.listRooms(userId);
    return rooms.find((r) => Number(r.id) === roomId)!;
  }

  /** Stream SSE: mensajes de las salas donde el usuario es miembro. */
  stream(userId: number): Observable<MessageEvent> {
    return this.bus.pipe(
      filter((e) => e.userId === userId),
      map(
        ({ message }) =>
          ({
            type: 'message',
            data: message,
          }) as MessageEvent,
      ),
    );
  }

  private async assertMember(userId: number, roomId: number): Promise<void> {
    const exists = await this.members.findOne({ where: { roomId, userId } });
    if (!exists) {
      throw new NotFoundException('Sala no encontrada');
    }
  }
}
