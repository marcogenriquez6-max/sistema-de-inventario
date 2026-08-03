import { User } from '../users/user.entity';
export declare class RefreshToken {
    id: number;
    jti: string;
    userId: number;
    user: User;
    tokenHash: string;
    expiresAt: Date;
    revokedAt: Date | null;
    replacedByJti: string | null;
    ip: string | null;
    userAgent: string | null;
    createdAt: Date;
}
