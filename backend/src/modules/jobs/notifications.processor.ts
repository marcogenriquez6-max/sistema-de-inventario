import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Worker } from 'bullmq';
import Redis from 'ioredis';
import { NotificationJobData } from './jobs.service';

/**
 * Procesador de la cola "notifications". En esta versión registra las
 * notificaciones en log estructurado y las expone via cache (in-app).
 * Punto de extensión para push/email en futuras integraciones.
 */
@Injectable()
export class NotificationsProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsProcessor.name);
  private worker: Worker | null = null;
  private connection: Redis | null = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const url = this.configService.get<string>('REDIS_URL');
    if (!url) {
      this.logger.log('NotificationsProcessor deshabilitado (sin Redis)');
      return;
    }
    this.connection = new Redis(url, { maxRetriesPerRequest: null });
    this.worker = new Worker(
      'notifications',
      async (job: Job<NotificationJobData>) => {
        const { recipient, title, message, priority } = job.data;
        this.logger.log(
          `[notificación] user=${recipient} prio=${priority ?? 'normal'} title="${title}" msg="${message}"`,
        );
      },
      { connection: this.connection, concurrency: 5 },
    );
    this.logger.log('NotificationsProcessor worker activo');
  }

  async onModuleDestroy(): Promise<void> {
    if (this.worker) {
      await this.worker.close().catch(() => undefined);
    }
    if (this.connection) {
      await this.connection.quit().catch(() => undefined);
    }
  }
}
