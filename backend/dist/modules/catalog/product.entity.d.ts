import { ProductCode } from './product-code.entity';
import { ProductCompat } from './product-compat.entity';
export declare class Product {
    id: number;
    sku: string;
    oemCode: string | null;
    barcode: string | null;
    name: string;
    category: string | null;
    brand: string | null;
    unit: string;
    stock: number;
    minStock: number;
    costPrice: string;
    basePrice: string;
    salePrice: string;
    warehouseAisle: string | null;
    warehouseShelf: string | null;
    warehouseLevel: string | null;
    warehouseBin: string | null;
    imageUrl: string | null;
    isActive: boolean;
    codes: ProductCode[];
    compat: ProductCompat[];
    createdAt: Date;
    updatedAt: Date;
}
