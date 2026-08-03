import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ICacheProvider } from './cache.providers';

export const CACHE_PROVIDER = 'CACHE_PROVIDER';
export const CACHE_IS_REDIS = 'CACHE_IS_REDIS';

/**
 * Servicio de cache con proveedor intercambiable (memoria por defecto,
 * Redis si REDIS_URL está definida). Fallback automático ante errores de Redis.
 */
@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly isRedis: boolean;

  constructor(
    @Inject(CACHE_PROVIDER) private readonly provider: ICacheProvider,
    @Inject(CACHE_IS_REDIS) isRedis: boolean,
  ) {
    this.isRedis = isRedis;
    if (isRedis) {
      this.logger.log('Cache provider: Redis');
    } else {
      this.logger.log('Cache provider: Memoria (REDIS_URL no definida)');
    }
  }

  get enabled(): boolean {
    return this.isRedis;
  }

  async get<T>(key: string): Promise<T | null> {
    return this.provider.get<T>(key);
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    await this.provider.set(key, value, ttlSeconds);
  }

  async del(key: string): Promise<void> {
    await this.provider.del(key);
  }

  async delPrefix(prefix: string): Promise<void> {
    await this.provider.delPrefix(prefix);
  }

  /** Helper: obtiene del cache o ejecuta el factory y lo almacena. */
  async remember<T>(
    key: string,
    ttlSeconds: number,
    factory: () => Promise<T>,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    const value = await factory();
    await this.set(key, value, ttlSeconds);
    return value;
  }

  async onModuleDestroy(): Promise<void> {
    // El cliente Redis (si existe) se cierra en el provider raíz.
  }
}
