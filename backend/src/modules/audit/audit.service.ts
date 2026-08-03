import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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

/**
 * Servicio de auditoría. Persiste cada acción sensible (RF-18) de forma
 * append-only (la BD bloquea UPDATE/DELETE sobre audit_logs).
 */
@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  async record(input: AuditInput): Promise<void> {
    const entry = this.repo.create({
      userId: input.userId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId != null ? String(input.resourceId) : null,
      metadata: input.metadata ?? null,
      ip: input.request?.ip ?? null,
      userAgent: input.request?.headers?.['user-agent']?.slice(0, 300) ?? null,
    });
    await this.repo.save(entry).catch((err) => {
      // La auditoría nunca debe tumbar una operación de negocio.
      // eslint-disable-next-line no-console
      console.error('Audit persistence failed:', err.message);
    });
  }

  async findAll(query: {
    page: number;
    pageSize: number;
    userId?: number;
    action?: string;
    resourceType?: string;
  }): Promise<{ items: AuditLog[]; total: number }> {
    const { page, pageSize, userId, action, resourceType } = query;
    const qb = this.repo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.user', 'user')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy('a.createdAt', 'DESC');

    if (userId) {
      qb.andWhere('a.userId = :userId', { userId });
    }
    if (action) {
      qb.andWhere('a.action = :action', { action });
    }
    if (resourceType) {
      qb.andWhere('a.resourceType = :resourceType', { resourceType });
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }
}
