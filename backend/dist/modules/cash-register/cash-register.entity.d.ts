import { User } from '../users/user.entity';
export type CashStatus = 'OPEN' | 'CLOSED';
export declare class CashRegister {
    id: number;
    openedBy: number;
    opener: User;
    initialBalance: string;
    expected: string;
    countedAmount: string | null;
    difference: string | null;
    status: CashStatus;
    closedBy: number | null;
    closedAt: Date | null;
    openedAt: Date;
}
