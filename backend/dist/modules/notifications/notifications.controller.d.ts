import { MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { NotificationsService } from './notifications.service';
import { AuthUser } from '../../common/decorators/current-user.decorator';
export declare class NotificationsController {
    private readonly notifications;
    constructor(notifications: NotificationsService);
    list(user: AuthUser, page?: string, pageSize?: string): Promise<{
        items: import("./notification.entity").Notification[];
        total: number;
        unread: number;
    }>;
    unreadCount(user: AuthUser): Promise<number>;
    stream(user: AuthUser): Observable<MessageEvent>;
    markRead(user: AuthUser, id: number): Promise<{
        ok: boolean;
    }>;
    markAllRead(user: AuthUser): Promise<{
        ok: boolean;
    }>;
    test(user: AuthUser, message?: string): Promise<import("./notification.entity").Notification>;
}
