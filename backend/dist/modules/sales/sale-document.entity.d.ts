import { User } from '../users/user.entity';
import { SaleItem } from './sale-item.entity';
export type DocType = 'NOTA' | 'FACTURA';
export type DocStatus = 'COMPLETED' | 'VOIDED';
export declare class SaleDocument {
    id: number;
    docType: DocType;
    docNumber: string;
    customerName: string;
    customerDoc: string | null;
    subtotal: string;
    taxRate: string;
    taxAmount: string;
    total: string;
    status: DocStatus;
    voidReason: string | null;
    userId: number;
    user: User;
    items: SaleItem[];
    createdAt: Date;
}
