import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';
import { Request } from 'express';
interface AuditInput {
    userId: number | null;
    action: string;
    resourceType: string;
    resourceId?: string | number | null;
    metadata?: Record<string, unknown>;
    request?: Request;
}
export declare class AuditService {
    private readonly repo;
    constructor(repo: Repository<AuditLog>);
    record(input: AuditInput): Promise<void>;
    findAll(query: {
        page: number;
        pageSize: number;
        userId?: number;
        action?: string;
        resourceType?: string;
    }): Promise<{
        items: AuditLog[];
        total: number;
    }>;
}
export {};
