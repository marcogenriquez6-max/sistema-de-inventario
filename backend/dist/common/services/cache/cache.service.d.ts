import { OnModuleDestroy } from '@nestjs/common';
import { ICacheProvider } from './cache.providers';
export declare const CACHE_PROVIDER = "CACHE_PROVIDER";
export declare const CACHE_IS_REDIS = "CACHE_IS_REDIS";
export declare class CacheService implements OnModuleDestroy {
    private readonly provider;
    private readonly logger;
    private readonly isRedis;
    constructor(provider: ICacheProvider, isRedis: boolean);
    get enabled(): boolean;
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
    del(key: string): Promise<void>;
    delPrefix(prefix: string): Promise<void>;
    remember<T>(key: string, ttlSeconds: number, factory: () => Promise<T>): Promise<T>;
    onModuleDestroy(): Promise<void>;
}
