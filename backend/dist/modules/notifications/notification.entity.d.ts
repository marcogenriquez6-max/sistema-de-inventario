export declare class Notification {
    id: number;
    userId: number;
    type: string;
    title: string;
    message: string | null;
    data: Record<string, unknown> | null;
    isRead: boolean;
    createdAt: Date;
}
