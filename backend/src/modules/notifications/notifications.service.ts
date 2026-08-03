import { Injectable, MessageEvent } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { filter, map, Observable, Subject } from 'rxjs';
import { Notification } from './notification.entity';
import { Role } from '../../common/decorators/roles.decorator';

interface BusEvent {
  userId: number;
  notification: Notification;
}

@Injectable()
export class NotificationsService {
  private readonly bus = new Subject<BusEvent>();

  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    userId: number,
    type: string,
    title: string,
    message?: string | null,
    data?: Record<string, unknown> | null,
  ): Promise<Notification> {
    const n = this.repo.create({
      userId,
      type,
      title,
      message: message ?? null,
      data: data ?? null,
    });
    const saved = await this.repo.save(n);
    this.bus.next({ userId, notification: saved });
    return saved;
  }

  /** Crea una notificación para todos los usuarios con ciertos roles. */
  async createForRoles(
    roles: Role[],
    type: string,
    title: string,
    message?: string | null,
    data?: Record<string, unknown> | null,
  ): Promise<void> {
    if (roles.length === 0) return;
    const rows: Array<{ id: number }> = await this.dataSource.query(
      `SELECT id FROM users WHERE is_active = TRUE AND role = ANY($1)`,
      [roles],
    );
    for (const r of rows) {
      await this.create(r.id, type, title, message, data);
    }
  }

  async list(
    userId: number,
    page = 1,
    pageSize = 20,
  ): Promise<{ items: Notification[]; total: number; unread: number }> {
    const [items, total] = await this.repo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    const unread = await this.repo.count({ where: { userId, isRead: false } });
    return { items, total, unread };
  }

  async markRead(userId: number, id: number): Promise<void> {
    await this.repo.update({ userId, id }, { isRead: true });
  }

  async markAllRead(userId: number): Promise<void> {
    await this.repo.update({ userId, isRead: false }, { isRead: true });
  }

  async unreadCount(userId: number): Promise<number> {
    return this.repo.count({ where: { userId, isRead: false } });
  }

  /** Stream SSE en tiempo real para un usuario conectado. */
  stream(userId: number): Observable<MessageEvent> {
    return this.bus.pipe(
      filter((e) => e.userId === userId),
      map(({ notification }) => ({ data: notification } as MessageEvent)),
    );
  }
}
