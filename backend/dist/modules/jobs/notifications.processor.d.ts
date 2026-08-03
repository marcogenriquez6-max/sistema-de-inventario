import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class NotificationsProcessor implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    private worker;
    private connection;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
