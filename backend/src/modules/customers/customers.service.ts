import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Customer } from './customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { DomainException } from '../../common/domain-exceptions';
import {
  toPaginated,
  Paginated,
} from '../../common/interfaces/paginated.interface';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import { Request } from 'express';

/** Gestión de clientes (CRUD + búsqueda). */
@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    private readonly auditService: AuditService,
  ) {}

  async findAll(query: QueryCustomerDto): Promise<Paginated<Customer>> {
    const { page, pageSize } = query;
    const qb = this.customerRepo
      .createQueryBuilder('c')
      .orderBy('c.name', 'ASC');

    if (query.q) {
      qb.andWhere(
        new Brackets((qb2) => {
          qb2
            .where('c.name ILIKE :q')
            .orWhere('c.code ILIKE :q')
            .orWhere('c.documentNumber ILIKE :q');
        }),
        { q: `%${query.q}%` },
      );
    }
    if (query.isActive !== undefined) {
      qb.andWhere('c.isActive = :active', { active: query.isActive === 1 });
    }

    const [items, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();
    return toPaginated(items, total, page, pageSize);
  }

  async findOne(id: number): Promise<Customer> {
    const customer = await this.customerRepo.findOne({ where: { id } });
    if (!customer) {
      throw new DomainException(404, 'Cliente no encontrado');
    }
    return customer;
  }

  /** Genera el siguiente código CLI-XXXXX disponible. */
  private async generateCode(): Promise<string> {
    const prefix = 'CLI-';
    const row = await this.customerRepo
      .createQueryBuilder('c')
      .select('c.code', 'code')
      .where('c.code LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('LENGTH(c.code)', 'DESC')
      .addOrderBy('c.code', 'DESC')
      .limit(1)
      .getRawOne<{ code: string }>();
    const last = row?.code;
    const num = last ? Number.parseInt(last.slice(prefix.length), 10) || 0 : 0;
    return `${prefix}${String(num + 1).padStart(5, '0')}`;
  }

  async create(
    dto: CreateCustomerDto,
    user: AuthUser,
    req: Request,
  ): Promise<Customer> {
    try {
      const code = dto.code?.trim() || (await this.generateCode());
      const customer = await this.customerRepo.save(
        this.customerRepo.create({ ...dto, code } as Partial<Customer>),
      );
      await this.auditService.record({
        userId: user.id,
        action: 'CUSTOMER:CREATE',
        resourceType: 'customers',
        resourceId: customer.id,
        metadata: { code, name: dto.name },
        request: req,
      });
      return customer;
    } catch (err) {
      if (
        (err as { driverError?: { code?: string } }).driverError?.code ===
        '23505'
      ) {
        throw new DomainException(
          409,
          'Ya existe un cliente con ese código o documento',
        );
      }
      throw err;
    }
  }

  async update(
    id: number,
    dto: UpdateCustomerDto,
    user: AuthUser,
    req: Request,
  ): Promise<Customer> {
    const customer = await this.findOne(id);
    Object.assign(customer, dto);
    const saved = await this.customerRepo.save(customer);
    await this.auditService.record({
      userId: user.id,
      action: 'CUSTOMER:UPDATE',
      resourceType: 'customers',
      resourceId: id,
      metadata: { changes: Object.keys(dto) },
      request: req,
    });
    return saved;
  }
}
