export declare class OpenRegisterDto {
    initialBalance: number;
}
export declare class CashMovementDto {
    movementType: 'INCOME' | 'EXPENSE' | 'DEPOSIT' | 'WITHDRAWAL';
    amount: number;
    description?: string;
}
export declare class CloseRegisterDto {
    countedAmount: number;
}
