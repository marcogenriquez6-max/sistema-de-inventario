import { CashRegister } from './cash-register.entity';
import { User } from '../users/user.entity';
export type CashMovementType = 'INCOME' | 'EXPENSE' | 'DEPOSIT' | 'WITHDRAWAL';
export declare class CashMovement {
    id: number;
    registerId: number;
    register: CashRegister;
    movementType: CashMovementType;
    amount: string;
    description: string | null;
    referenceType: string | null;
    referenceId: string | null;
    userId: number;
    user: User;
    createdAt: Date;
}
