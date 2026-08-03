import { JournalLine } from './journal-line.entity';
export declare class JournalEntry {
    id: number;
    entryNumber: string;
    date: string;
    description: string | null;
    referenceType: string | null;
    referenceId: string | null;
    createdBy: number;
    createdAt: Date;
    lines: JournalLine[];
}
