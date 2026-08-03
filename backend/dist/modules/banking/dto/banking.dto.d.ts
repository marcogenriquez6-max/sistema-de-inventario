export declare class CreateBankAccountDto {
    name: string;
    bank: string;
    accountType?: 'SAVINGS' | 'CHECKING' | 'FIXED';
    accountNumber?: string;
    currency?: string;
    balance?: number;
}
export declare class BankMovementDto {
    movementType: 'DEPOSIT' | 'WITHDRAWAL';
    amount: number;
    description?: string;
}
export declare class TransferDto {
    toAccountId: number;
    amount: number;
    description?: string;
}
