import { OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
export declare const REDIS_CLIENT = "REDIS_CLIENT";
export declare class CacheModule implements OnModuleDestroy {
    private readonly redisClient;
    constructor(redisClient: Redis | null);
    onModuleDestroy(): Promise<void>;
}
