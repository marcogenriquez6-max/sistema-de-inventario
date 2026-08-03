import { DataSource, Repository } from 'typeorm';
import { Account } from './account.entity';
import { JournalEntry } from './journal-entry.entity';
import { CreateAccountDto, CreateJournalEntryDto } from './dto/accounting.dto';
import { SettingsService } from '../settings/settings.service';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import { Request } from 'express';
export declare class AccountingService {
    private readonly accountRepo;
    private readonly entryRepo;
    private readonly settingsService;
    private readonly auditService;
    private readonly dataSource;
    constructor(accountRepo: Repository<Account>, entryRepo: Repository<JournalEntry>, settingsService: SettingsService, auditService: AuditService, dataSource: DataSource);
    listAccounts(): Promise<Account[]>;
    createAccount(dto: CreateAccountDto, user: AuthUser, req: Request): Promise<Account>;
    createEntry(dto: CreateJournalEntryDto, user: AuthUser, req: Request): Promise<JournalEntry>;
    findOne(id: number): Promise<JournalEntry>;
    listEntries(page?: number, pageSize?: number): Promise<{
        items: JournalEntry[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    trialBalance(): Promise<{
        code: string;
        name: string;
        debit: number;
        credit: number;
    }[]>;
    private nextEntryNumber;
    private round2;
}
