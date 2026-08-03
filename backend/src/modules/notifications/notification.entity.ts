import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ name: 'user_id' })
  userId: number;

  @Column({ length: 30 })
  type: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  message: string | null;

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, unknown> | null;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
