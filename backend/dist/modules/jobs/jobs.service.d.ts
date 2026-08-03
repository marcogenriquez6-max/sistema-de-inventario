import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export type ReportJobType = 'low-stock' | 'sales-by-day';
export interface ReportJobData {
    type: ReportJobType;
    params: Record<string, unknown>;
    requestedBy: number;
}
export interface NotificationJobData {
    recipient: number;
    title: string;
    message: string;
    priority?: 'low' | 'normal' | 'high';
}
export declare class JobsService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    private readonly connection;
    private readonly queues;
    private readonly enabled;
    constructor(configService: ConfigService);
    get isEnabled(): boolean;
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    enqueueReport(data: ReportJobData): Promise<void>;
    enqueueNotification(data: NotificationJobData): Promise<void>;
    private add;
}
