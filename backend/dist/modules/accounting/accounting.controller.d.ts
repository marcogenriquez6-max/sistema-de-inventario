import { Request } from 'express';
import { AccountingService } from './accounting.service';
import { CreateAccountDto, CreateJournalEntryDto } from './dto/accounting.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { AuthUser } from '../../common/decorators/current-user.decorator';
export declare class AccountingController {
    private readonly accountingService;
    constructor(accountingService: AccountingService);
    accounts(): Promise<import("./account.entity").Account[]>;
    createAccount(dto: CreateAccountDto, user: AuthUser, req: Request): Promise<import("./account.entity").Account>;
    createEntry(dto: CreateJournalEntryDto, user: AuthUser, req: Request): Promise<import("./journal-entry.entity").JournalEntry>;
    listEntries(query: PaginationDto): Promise<{
        items: import("./journal-entry.entity").JournalEntry[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    entry(id: number): Promise<import("./journal-entry.entity").JournalEntry>;
    trialBalance(): Promise<{
        code: string;
        name: string;
        debit: number;
        credit: number;
    }[]>;
}
