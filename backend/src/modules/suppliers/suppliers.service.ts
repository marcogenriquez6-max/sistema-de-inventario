import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Supplier } from './supplier.entity';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { DomainException } from '../../common/domain-exceptions';
import {
  toPaginated,
  Paginated,
} from '../../common/interfaces/paginated.interface';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import { Request } from 'express';

/** Gestión de proveedores. */
@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepo: Repository<Supplier>,
    private readonly auditService: AuditService,
  ) {}

  async findAll(
    query: PaginationDto & { q?: string },
  ): Promise<Paginated<Supplier>> {
    const { page, pageSize } = query;
    const qb = this.supplierRepo
      .createQueryBuilder('s')
      .orderBy('s.name', 'ASC');
    if (query.q) {
      qb.andWhere(
        new Brackets((qb2) => {
          qb2
            .where('s.name ILIKE :q')
            .orWhere('s.code ILIKE :q')
            .orWhere('s.taxId ILIKE :q');
        }),
        { q: `%${query.q}%` },
      );
    }
    const [items, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();
    return toPaginated(items, total, page, pageSize);
  }

  async findOne(id: number): Promise<Supplier> {
    const supplier = await this.supplierRepo.findOne({ where: { id } });
    if (!supplier) {
      throw new DomainException(404, 'Proveedor no encontrado');
    }
    return supplier;
  }

  async create(
    dto: CreateSupplierDto,
    user: AuthUser,
    req: Request,
  ): Promise<Supplier> {
    try {
      const supplier = await this.supplierRepo.save(
        this.supplierRepo.create(dto as Partial<Supplier>),
      );
      await this.auditService.record({
        userId: user.id,
        action: 'SUPPLIER:CREATE',
        resourceType: 'suppliers',
        resourceId: supplier.id,
        metadata: { code: dto.code, name: dto.name },
        request: req,
      });
      return supplier;
    } catch (err) {
      if (
        (err as { driverError?: { code?: string } }).driverError?.code ===
        '23505'
      ) {
        throw new DomainException(
          409,
          'Ya existe un proveedor con ese código o NIT',
        );
      }
      throw err;
    }
  }

  async update(
    id: number,
    dto: UpdateSupplierDto,
    user: AuthUser,
    req: Request,
  ): Promise<Supplier> {
    const supplier = await this.findOne(id);
    Object.assign(supplier, dto);
    const saved = await this.supplierRepo.save(supplier);
    await this.auditService.record({
      userId: user.id,
      action: 'SUPPLIER:UPDATE',
      resourceType: 'suppliers',
      resourceId: id,
      metadata: { changes: Object.keys(dto) },
      request: req,
    });
    return saved;
  }
}
