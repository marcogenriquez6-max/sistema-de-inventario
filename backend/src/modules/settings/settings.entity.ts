import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Parámetro global. Valores conocidos: tax_rate, company_name,
 * default_margin_pct, doc_sequence.
 */
@Entity('settings')
export class Setting {
  @PrimaryColumn({ length: 60 })
  key: string;

  @Column({ type: 'jsonb' })
  value: Record<string, unknown>;

  @Column({ type: 'int', name: 'updated_by', nullable: true })
  updatedBy: number | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

/**
 * Historial de versiones de parámetros. Permite conocer el IVA vigente
 * en una fecha determinada (auditoría de precios históricos).
 */
@Entity('settings_history')
export class SettingHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 60 })
  key: string;

  @Column({ type: 'jsonb' })
  value: Record<string, unknown>;

  @Column({ type: 'int', name: 'changed_by', nullable: true })
  changedBy: number | null;

  @CreateDateColumn({ name: 'changed_at', type: 'timestamptz' })
  changedAt: Date;
}
