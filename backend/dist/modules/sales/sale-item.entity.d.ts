import { Product } from '../catalog/product.entity';
import { SaleDocument } from './sale-document.entity';
export declare class SaleItem {
    id: number;
    saleId: number;
    sale: SaleDocument;
    productId: number;
    product: Product;
    productSku: string;
    productName: string;
    quantity: number;
    unitCost: string;
    unitBase: string;
    unitSale: string;
    taxRate: string;
    taxAmount: string;
    lineTotal: string;
}
