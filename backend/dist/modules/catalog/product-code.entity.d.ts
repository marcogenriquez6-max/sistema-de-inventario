import { Product } from './product.entity';
export type CodeType = 'OEM' | 'BARCODE' | 'SKU_ALT';
export declare class ProductCode {
    id: number;
    productId: number;
    product: Product;
    codeType: CodeType;
    codeValue: string;
    createdAt: Date;
}
