import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../common/decorators/roles.decorator';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'admin@sistema.com' })
  @Column({ length: 255, unique: true })
  email: string;

  @Column({ name: 'password_hash', length: 255, select: false })
  passwordHash: string;

  @ApiProperty({ example: 'Administrador' })
  @Column({ name: 'full_name', length: 150 })
  fullName: string;

  @ApiProperty({
    enum: ['ADMIN', 'SELLER', 'INVENTORY_MANAGER', 'MANAGER', 'AUDITOR'],
  })
  @Index()
  @Column({ length: 30, default: 'SELLER' })
  role: Role;

  @ApiProperty()
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
