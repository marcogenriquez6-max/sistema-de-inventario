export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
export declare class Account {
    id: number;
    code: string;
    name: string;
    type: AccountType;
    parentId: number | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
