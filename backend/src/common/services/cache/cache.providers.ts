import { Injectable, Logger } from '@nestjs/common';

/**
 * Contrato de cache (port). Permite intercambiar la implementación
 * (memoria, Redis) sin tocar el dominio (segregación de interfaz).
 */
export interface ICacheProvider {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  delPrefix(prefix: string): Promise<void>;
}

/** Proveedor en memoria (dev/single-instance). */
@Injectable()
export class MemoryCacheProvider implements ICacheProvider {
  private readonly store = new Map<
    string,
    { value: unknown; expiresAt: number }
  >();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }
    if (entry.expiresAt !== 0 && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : 0,
    });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async delPrefix(prefix: string): Promise<void> {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }
}

/** Proveedor Redis (multi-instancia / producción). */
@Injectable()
export class RedisCacheProvider implements ICacheProvider {
  private readonly logger = new Logger(RedisCacheProvider.name);

  constructor(private readonly redisClient: import('ioredis').Redis) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redisClient.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (err) {
      this.logger.warn(`Redis get failed: ${(err as Error).message}`);
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
    try {
      const raw = JSON.stringify(value);
      if (ttlSeconds > 0) {
        await this.redisClient.set(key, raw, 'EX', ttlSeconds);
      } else {
        await this.redisClient.set(key, raw);
      }
    } catch (err) {
      this.logger.warn(`Redis set failed: ${(err as Error).message}`);
    }
  }

  async del(key: string): Promise<void> {
    await this.redisClient.del(key).catch(() => undefined);
  }

  async delPrefix(prefix: string): Promise<void> {
    try {
      const keys = await this.redisClient.keys(`${prefix}*`);
      if (keys.length > 0) {
        await this.redisClient.del(...keys);
      }
    } catch (err) {
      this.logger.warn(`Redis delPrefix failed: ${(err as Error).message}`);
    }
  }
}
