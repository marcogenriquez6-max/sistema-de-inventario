import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import Redis from 'ioredis';

export type ReportJobType = 'low-stock' | 'sales-by-day';

export interface ReportJobData {
  type: ReportJobType;
  params: Record<string, unknown>;
  requestedBy: number;
}

export interface NotificationJobData {
  recipient: number;
  title: string;
  message: string;
  priority?: 'low' | 'normal' | 'high';
}

/**
 * Puerta de enqueue de BullMQ. Si REDIS_URL no está definida, `enabled`
 * es false y los productores pueden degradar (ej: ejecución directa).
 */
@Injectable()
export class JobsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobsService.name);
  private readonly connection: Redis | null = null;
  private readonly queues = new Map<string, Queue>();
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('REDIS_URL');
    this.enabled = Boolean(url);
    this.connection = url
      ? new Redis(url, { maxRetriesPerRequest: null })
      : null;
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  async onModuleInit(): Promise<void> {
    if (!this.enabled) {
      this.logger.log('BullMQ deshabilitado (REDIS_URL no definida)');
      return;
    }
    this.queues.set(
      'reports',
      new Queue('reports', { connection: this.connection as Redis }),
    );
    this.queues.set(
      'notifications',
      new Queue('notifications', { connection: this.connection as Redis }),
    );
    this.logger.log('BullMQ colas listas: reports, notifications');
  }

  async onModuleDestroy(): Promise<void> {
    for (const q of this.queues.values()) {
      await q.close().catch(() => undefined);
    }
    if (this.connection) {
      await this.connection.quit().catch(() => undefined);
    }
  }

  async enqueueReport(data: ReportJobData): Promise<void> {
    await this.add('reports', 'generate', data);
  }

  async enqueueNotification(data: NotificationJobData): Promise<void> {
    await this.add('notifications', 'send', data, {
      priority: data.priority === 'high' ? 1 : 2,
    });
  }

  private async add<T>(
    queueName: string,
    jobName: string,
    data: T,
    opts?: { priority?: number },
  ): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      this.logger.warn(
        `Cola "${queueName}" no disponible; tarea "${jobName}" omitida`,
      );
      return;
    }
    await queue.add(jobName, data, {
      priority: opts?.priority,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });
  }
}
