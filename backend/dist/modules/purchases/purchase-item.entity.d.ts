import { Product } from '../catalog/product.entity';
import { PurchaseDocument } from './purchase-document.entity';
export declare class PurchaseItem {
    id: number;
    purchaseId: number;
    purchase: PurchaseDocument;
    productId: number;
    product: Product;
    productSku: string;
    productName: string;
    quantity: number;
    unitCost: string;
    lineTotal: string;
}
