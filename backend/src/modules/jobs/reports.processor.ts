import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Worker } from 'bullmq';
import Redis from 'ioredis';
import { CacheService } from '../../common/services/cache/cache.service';
import { ReportsService } from '../reports/reports.service';
import { ReportJobData } from './jobs.service';

/**
 * Procesador de la cola "reports". Genera reportes pesados de forma
 * asíncrona y guarda el resultado en cache (la API lo lee después).
 */
@Injectable()
export class ReportsProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReportsProcessor.name);
  private worker: Worker | null = null;
  private connection: Redis | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
    private readonly reportsService: ReportsService,
  ) {}

  async onModuleInit(): Promise<void> {
    const url = this.configService.get<string>('REDIS_URL');
    if (!url) {
      this.logger.log('ReportsProcessor deshabilitado (sin Redis)');
      return;
    }
    this.connection = new Redis(url, { maxRetriesPerRequest: null });
    this.worker = new Worker(
      'reports',
      async (job: Job<ReportJobData>) => this.handle(job),
      { connection: this.connection, concurrency: 2 },
    );
    this.worker.on('failed', (job, err) => {
      this.logger.error(`Reporte falló: ${err.message}`);
    });
    this.logger.log('ReportsProcessor worker activo');
  }

  private async handle(job: Job<ReportJobData>): Promise<void> {
    const { type, params, requestedBy } = job.data;
    this.logger.log(`Generando reporte "${type}" para usuario ${requestedBy}`);

    if (type === 'low-stock') {
      const result = await this.reportsService.lowStock(1, 500);
      await this.cacheService.set(
        `report:low-stock:${requestedBy}`,
        result,
        900,
      );
    } else if (type === 'sales-by-day') {
      const from = String(params.from ?? '');
      const to = String(params.to ?? '');
      const result = await this.reportsService.salesByDay(from, to);
      await this.cacheService.set(
        `report:sales-by-day:${requestedBy}`,
        result,
        900,
      );
    }
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
