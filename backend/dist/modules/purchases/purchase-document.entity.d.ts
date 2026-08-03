import { Supplier } from '../suppliers/supplier.entity';
import { PurchaseItem } from './purchase-item.entity';
export type PurchaseStatus = 'RECEIVED' | 'VOIDED';
export declare class PurchaseDocument {
    id: number;
    docNumber: string;
    supplierId: number;
    supplier: Supplier;
    supplierName: string;
    invoiceNumber: string | null;
    subtotal: string;
    taxRate: string;
    taxAmount: string;
    total: string;
    status: PurchaseStatus;
    voidReason: string | null;
    userId: number;
    items: PurchaseItem[];
    createdAt: Date;
}
