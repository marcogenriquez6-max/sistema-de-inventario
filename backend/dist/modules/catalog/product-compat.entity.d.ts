import { Product } from './product.entity';
export declare class ProductCompat {
    id: number;
    productId: number;
    product: Product;
    vehicleBrand: string;
    vehicleModel: string;
    yearFrom: number | null;
    yearTo: number | null;
    engineType: string | null;
    createdAt: Date;
}
