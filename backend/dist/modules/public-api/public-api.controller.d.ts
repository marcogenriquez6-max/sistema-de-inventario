import { Repository } from 'typeorm';
import { Product } from '../catalog/product.entity';
export declare class PublicSearchDto {
    q?: string;
    page?: number;
    pageSize?: number;
}
export declare class PublicApiController {
    private readonly productRepo;
    constructor(productRepo: Repository<Product>);
    products(query: PublicSearchDto): Promise<{
        items: {
            id: number;
            sku: string;
            oemCode: string | null;
            name: string;
            brand: string | null;
            category: string | null;
            stock: number;
            salePrice: string;
            warehouseAisle: string | null;
            warehouseShelf: string | null;
            warehouseLevel: string | null;
            warehouseBin: string | null;
        }[];
        meta: {
            page: number;
            pageSize: number;
            totalItems: number;
            totalPages: number;
        };
    }>;
    status(): {
        service: string;
        version: string;
        status: string;
    };
}
