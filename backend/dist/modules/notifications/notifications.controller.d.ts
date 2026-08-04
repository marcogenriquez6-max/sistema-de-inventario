import { MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { NotificationsService } from './notifications.service';
import { FcmService } from './fcm.service';
import { AuthUser } from '../../common/decorators/current-user.decorator';
export declare class NotificationsController {
    private readonly notifications;
    private readonly fcm;
    constructor(notifications: NotificationsService, fcm: FcmService);
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
    registerFcmToken(user: AuthUser, body: {
        token: string;
        device?: string;
    }): Promise<{
        ok: boolean;
        error: string;
    } | {
        ok: boolean;
        error?: undefined;
    }>;
    removeFcmToken(user: AuthUser, body: {
        token: string;
    }): Promise<{
        ok: boolean;
        error: string;
    } | {
        ok: boolean;
        error?: undefined;
    }>;
    test(user: AuthUser, message?: string): Promise<import("./notification.entity").Notification>;
}
