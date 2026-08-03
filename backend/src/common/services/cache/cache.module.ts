import { Global, Inject, Module, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { CacheService, CACHE_IS_REDIS, CACHE_PROVIDER } from './cache.service';
import { MemoryCacheProvider, RedisCacheProvider } from './cache.providers';

export const REDIS_CLIENT = 'REDIS_CLIENT';

/**
 * Módulo global de cache. Registra el proveedor correcto según REDIS_URL.
 * Si no hay Redis, usa memoria (el resto de la app no nota la diferencia).
 */
@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('REDIS_URL');
        return url
          ? new Redis(url, { maxRetriesPerRequest: 1, lazyConnect: true })
          : null;
      },
    },
    {
      provide: CACHE_PROVIDER,
      inject: [REDIS_CLIENT],
      useFactory: (client: Redis | null) =>
        client ? new RedisCacheProvider(client) : new MemoryCacheProvider(),
    },
    {
      provide: CACHE_IS_REDIS,
      inject: [REDIS_CLIENT],
      useFactory: (client: Redis | null) => client !== null,
    },
    CacheService,
  ],
  exports: [CacheService],
})
export class CacheModule implements OnModuleDestroy {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis | null,
  ) {}

  async onModuleDestroy(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit().catch(() => undefined);
    }
  }
}
