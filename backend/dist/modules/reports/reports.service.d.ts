import { DataSource, Repository } from 'typeorm';
import { SaleDocument } from '../sales/sale-document.entity';
import { Product } from '../catalog/product.entity';
export interface DashboardSummary {
    todaySales: {
        count: number;
        total: number;
    };
    monthSales: {
        count: number;
        total: number;
    };
    lowStockCount: number;
    totalProducts: number;
    totalStockValue: number;
    lowStockProducts: {
        id: number;
        sku: string;
        name: string;
        stock: number;
        minStock: number;
        salePrice: string;
    }[];
    recentSales: {
        id: number;
        docNumber: string;
        docType: string;
        total: string;
        customerName: string;
        createdAt: Date;
    }[];
}
export declare class ReportsService {
    private readonly saleRepo;
    private readonly productRepo;
    private readonly dataSource;
    constructor(saleRepo: Repository<SaleDocument>, productRepo: Repository<Product>, dataSource: DataSource);
    dashboard(): Promise<DashboardSummary>;
    lowStock(page?: number, pageSize?: number): Promise<{
        items: Product[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    salesByDay(from: string, to: string): Promise<{
        day: string;
        total: number;
        count: number;
    }[]>;
}
