import { Account } from './account.entity';
import { JournalEntry } from './journal-entry.entity';
export declare class JournalLine {
    id: number;
    entryId: number;
    entry: JournalEntry;
    accountId: number;
    account: Account;
    debit: string;
    credit: string;
}
