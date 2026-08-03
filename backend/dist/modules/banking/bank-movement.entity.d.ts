import { BankAccount } from './bank-account.entity';
import { User } from '../users/user.entity';
export type BankMovementType = 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER_IN' | 'TRANSFER_OUT';
export declare class BankMovement {
    id: number;
    accountId: number;
    account: BankAccount;
    movementType: BankMovementType;
    amount: string;
    description: string | null;
    userId: number;
    user: User;
    createdAt: Date;
}
