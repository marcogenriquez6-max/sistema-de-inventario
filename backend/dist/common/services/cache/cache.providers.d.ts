export interface ICacheProvider {
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
    del(key: string): Promise<void>;
    delPrefix(prefix: string): Promise<void>;
}
export declare class MemoryCacheProvider implements ICacheProvider {
    private readonly store;
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
    del(key: string): Promise<void>;
    delPrefix(prefix: string): Promise<void>;
}
export declare class RedisCacheProvider implements ICacheProvider {
    private readonly redisClient;
    private readonly logger;
    constructor(redisClient: import('ioredis').Redis);
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
    del(key: string): Promise<void>;
    delPrefix(prefix: string): Promise<void>;
}
