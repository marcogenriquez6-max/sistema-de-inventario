import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Account } from './account.entity';
import { JournalEntry } from './journal-entry.entity';

/**
 * Línea de asiento: cuenta, débito y crédito.
 */
@Entity('journal_lines')
export class JournalLine {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ name: 'entry_id' })
  entryId: number;

  @ManyToOne(() => JournalEntry, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'entry_id' })
  entry: JournalEntry;

  @Column({ name: 'account_id' })
  accountId: number;

  @ManyToOne(() => Account, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @Column({
    name: 'debit',
    type: 'numeric',
    precision: 14,
    scale: 2,
    default: '0',
  })
  debit: string;

  @Column({
    name: 'credit',
    type: 'numeric',
    precision: 14,
    scale: 2,
    default: '0',
  })
  credit: string;
}
