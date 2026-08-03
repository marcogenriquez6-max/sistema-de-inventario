import { ReportsService } from './reports.service';
declare class RangeDto {
    from?: string;
    to?: string;
}
declare class LowStockDto {
    page?: number;
    pageSize?: number;
}
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    dashboard(): Promise<import("./reports.service").DashboardSummary>;
    lowStock(query: LowStockDto): Promise<{
        items: import("../catalog/product.entity").Product[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    salesByDay(query: RangeDto): Promise<{
        day: string;
        total: number;
        count: number;
    }[]>;
}
export {};
