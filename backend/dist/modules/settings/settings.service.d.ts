import { OnApplicationBootstrap } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Setting, SettingHistory } from './settings.entity';
export interface TaxConfig {
    value: number;
}
export declare class SettingsService implements OnApplicationBootstrap {
    private readonly settingRepo;
    private readonly historyRepo;
    private cache;
    constructor(settingRepo: Repository<Setting>, historyRepo: Repository<SettingHistory>);
    onApplicationBootstrap(): Promise<void>;
    private refreshCache;
    get<T = Record<string, unknown>>(key: string): Promise<T | null>;
    getTaxRate(): Promise<number>;
    getDefaultMarginPct(): Promise<number>;
    set(key: string, value: Record<string, unknown>, userId: number | null): Promise<Setting>;
    getAll(): Promise<Setting[]>;
    getHistory(key: string): Promise<SettingHistory[]>;
    getSettingOrFail(key: string): Promise<Setting>;
}
