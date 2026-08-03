import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

/**
 * Sesión de refresh token. Registra el jti, el hash del token, expiración,
 * revocación y encadenamiento de rotación para detectar reuso.
 */
@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 64 })
  jti: string;

  @Index()
  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'token_hash', length: 255 })
  tokenHash: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  @Column({
    type: 'varchar',
    name: 'replaced_by_jti',
    length: 64,
    nullable: true,
  })
  replacedByJti: string | null;

  @Column({ type: 'inet', nullable: true })
  ip: string | null;

  @Column({ type: 'varchar', name: 'user_agent', length: 300, nullable: true })
  userAgent: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
