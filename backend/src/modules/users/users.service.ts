import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DomainException } from '../../common/domain-exceptions';
import {
  toPaginated,
  Paginated,
} from '../../common/interfaces/paginated.interface';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import { Request } from 'express';

/** Servicio de usuarios: CRUD y RBAC (CU-02). */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly auditService: AuditService,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  /** Incluye el hash para verificación de credenciales. */
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepo
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.email = :email', { email })
      .getOne();
  }

  async findById(id: number): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new DomainException(404, 'Usuario no encontrado');
    }
    return user;
  }

  async findAll(query: {
    page: number;
    pageSize: number;
    search?: string;
    role?: string;
    isActive?: number;
  }): Promise<Paginated<User>> {
    const { page, pageSize, search, role, isActive } = query;
    const where: Record<string, unknown> = {};
    if (role) {
      where.role = role;
    }
    if (isActive !== undefined) {
      where.isActive = isActive === 1;
    }
    if (search) {
      where.email = Like(`%${search}%`);
    }
    const [items, total] = await this.userRepo.findAndCount({
      where,
      order: { fullName: 'ASC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return toPaginated(items, total, page, pageSize);
  }

  async create(
    dto: CreateUserDto,
    actor: AuthUser,
    req: Request,
  ): Promise<User> {
    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new DomainException(409, 'Ya existe un usuario con ese correo');
    }
    const user = this.userRepo.create({
      email: dto.email,
      fullName: dto.fullName,
      passwordHash: await argon2.hash(dto.password),
      role: dto.role,
      isActive: dto.isActive ?? true,
    });
    const saved = await this.userRepo.save(user);
    await this.auditService.record({
      userId: actor.id,
      action: 'USER:CREATE',
      resourceType: 'users',
      resourceId: saved.id,
      metadata: { email: dto.email, role: dto.role },
      request: req,
    });
    return saved;
  }

  async update(
    id: number,
    dto: UpdateUserDto,
    actor: AuthUser,
    req: Request,
  ): Promise<User> {
    const user = await this.findById(id);
    if (dto.fullName !== undefined) {
      user.fullName = dto.fullName;
    }
    if (dto.role !== undefined) {
      user.role = dto.role;
    }
    if (dto.isActive !== undefined) {
      user.isActive = dto.isActive;
    }
    if (dto.password !== undefined) {
      user.passwordHash = await argon2.hash(dto.password);
    }
    const saved = await this.userRepo.save(user);
    await this.auditService.record({
      userId: actor.id,
      action: 'USER:UPDATE',
      resourceType: 'users',
      resourceId: id,
      metadata: { changes: Object.keys(dto) },
      request: req,
    });
    return saved;
  }

  async changePassword(
    id: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userRepo
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.id = :id', { id })
      .getOne();
    if (!user) {
      throw new DomainException(404, 'Usuario no encontrado');
    }
    const valid = await argon2.verify(user.passwordHash, currentPassword);
    if (!valid) {
      throw new DomainException(401, 'La contraseña actual es incorrecta');
    }
    user.passwordHash = await argon2.hash(newPassword);
    await this.userRepo.save(user);
  }
}
