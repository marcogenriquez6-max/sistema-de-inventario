import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../../common/services/cache/cache.service';
import { ReportsService } from '../reports/reports.service';
export declare class ReportsProcessor implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly cacheService;
    private readonly reportsService;
    private readonly logger;
    private worker;
    private connection;
    constructor(configService: ConfigService, cacheService: CacheService, reportsService: ReportsService);
    onModuleInit(): Promise<void>;
    private handle;
    onModuleDestroy(): Promise<void>;
}
