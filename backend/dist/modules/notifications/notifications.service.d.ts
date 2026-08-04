import { MessageEvent } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Observable } from 'rxjs';
import { Notification } from './notification.entity';
import { FcmService } from './fcm.service';
import { Role } from '../../common/decorators/roles.decorator';
export declare class NotificationsService {
    private readonly repo;
    private readonly dataSource;
    private readonly fcm;
    private readonly bus;
    constructor(repo: Repository<Notification>, dataSource: DataSource, fcm: FcmService);
    create(userId: number, type: string, title: string, message?: string | null, data?: Record<string, unknown> | null): Promise<Notification>;
    createForRoles(roles: Role[], type: string, title: string, message?: string | null, data?: Record<string, unknown> | null): Promise<void>;
    list(userId: number, page?: number, pageSize?: number): Promise<{
        items: Notification[];
        total: number;
        unread: number;
    }>;
    markRead(userId: number, id: number): Promise<void>;
    markAllRead(userId: number): Promise<void>;
    unreadCount(userId: number): Promise<number>;
    stream(userId: number): Observable<MessageEvent>;
}
