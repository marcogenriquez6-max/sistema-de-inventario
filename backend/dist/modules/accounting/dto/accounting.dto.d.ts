export declare class JournalLineDto {
    accountId: number;
    debit: number;
    credit: number;
}
export declare class CreateJournalEntryDto {
    date: string;
    description?: string;
    referenceType?: string;
    referenceId?: string;
    lines: JournalLineDto[];
}
export declare class CreateAccountDto {
    code: string;
    name: string;
    type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
    parentId?: number;
}
