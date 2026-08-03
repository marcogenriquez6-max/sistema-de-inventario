import { Product } from '../catalog/product.entity';
import { User } from '../users/user.entity';
export type MovementType = 'PURCHASE' | 'SALE' | 'ADJUST' | 'MERMA' | 'RETURN';
export declare class StockMovement {
    id: number;
    productId: number;
    product: Product;
    movementType: MovementType;
    quantity: number;
    unitCost: string;
    unitBase: string;
    unitSale: string;
    concept: string | null;
    referenceType: string | null;
    referenceId: string | null;
    userId: number | null;
    user: User | null;
    createdAt: Date;
}
