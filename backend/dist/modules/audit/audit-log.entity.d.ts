import { User } from '../users/user.entity';
export declare class AuditLog {
    id: number;
    userId: number | null;
    user: User | null;
    action: string;
    resourceType: string;
    resourceId: string | null;
    metadata: Record<string, unknown> | null;
    ip: string | null;
    userAgent: string | null;
    createdAt: Date;
}
