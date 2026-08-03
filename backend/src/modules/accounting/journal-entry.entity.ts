import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { JournalLine } from './journal-line.entity';

/**
 * Asiento de diario. Todo asiento debe cuadrar (suma débitos = suma créditos),
 * validado en la capa de aplicación.
 */
@Entity('journal_entries')
export class JournalEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'entry_number', length: 30, unique: true })
  entryNumber: string;

  @Index()
  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @Column({
    type: 'varchar',
    name: 'reference_type',
    length: 30,
    nullable: true,
  })
  referenceType: string | null;

  @Column({ name: 'reference_id', type: 'bigint', nullable: true })
  referenceId: string | null;

  @Column({ name: 'created_by' })
  createdBy: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  lines: JournalLine[];
}
