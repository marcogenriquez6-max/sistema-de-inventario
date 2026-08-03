import { SettingsService } from '../settings/settings.service';
export interface PriceBreakdown {
    costPrice: number;
    basePrice: number;
    salePrice: number;
    taxRate: number;
    taxAmount: number;
    marginPct: number;
}
export declare class PricingService {
    private readonly settingsService;
    constructor(settingsService: SettingsService);
    private round2;
    getTaxRate(): Promise<number>;
    computeSalePrice(basePrice: number, taxRate?: number): Promise<number>;
    computeSuggestedBasePrice(costPrice: number): Promise<number>;
    breakdown(costPrice: number, basePrice: number, taxRate?: number): Promise<PriceBreakdown>;
    round(value: number): number;
}
