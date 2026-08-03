import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Employee } from './employee.entity';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { DomainException } from '../../common/domain-exceptions';
import {
  toPaginated,
  Paginated,
} from '../../common/interfaces/paginated.interface';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import { Request } from 'express';

/** Módulo RR.HH.: ficha de empleados. */
@Injectable()
export class HrService {
  constructor(
    @InjectRepository(Employee)
    private readonly empRepo: Repository<Employee>,
    private readonly auditService: AuditService,
  ) {}

  async findAll(
    query: PaginationDto & { q?: string; department?: string },
  ): Promise<Paginated<Employee>> {
    const { page, pageSize } = query;
    const qb = this.empRepo
      .createQueryBuilder('e')
      .orderBy('e.fullName', 'ASC');
    if (query.q) {
      qb.andWhere(
        new Brackets((qb2) => {
          qb2
            .where('e.fullName ILIKE :q')
            .orWhere('e.code ILIKE :q')
            .orWhere('e.documentNumber ILIKE :q');
        }),
        { q: `%${query.q}%` },
      );
    }
    if (query.department) {
      qb.andWhere('e.department = :department', {
        department: query.department,
      });
    }
    const [items, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();
    return toPaginated(items, total, page, pageSize);
  }

  async findOne(id: number): Promise<Employee> {
    const employee = await this.empRepo.findOne({ where: { id } });
    if (!employee) {
      throw new DomainException(404, 'Empleado no encontrado');
    }
    return employee;
  }

  async create(
    dto: CreateEmployeeDto,
    user: AuthUser,
    req: Request,
  ): Promise<Employee> {
    try {
      const employee = await this.empRepo.save(
        this.empRepo.create(dto as Partial<Employee>),
      );
      await this.auditService.record({
        userId: user.id,
        action: 'EMPLOYEE:CREATE',
        resourceType: 'employees',
        resourceId: employee.id,
        metadata: { code: dto.code, fullName: dto.fullName },
        request: req,
      });
      return employee;
    } catch (err) {
      if (
        (err as { driverError?: { code?: string } }).driverError?.code ===
        '23505'
      ) {
        throw new DomainException(409, 'Ya existe un empleado con ese código');
      }
      throw err;
    }
  }

  async update(
    id: number,
    dto: UpdateEmployeeDto,
    user: AuthUser,
    req: Request,
  ): Promise<Employee> {
    const employee = await this.findOne(id);
    Object.assign(employee, dto);
    const saved = await this.empRepo.save(employee);
    await this.auditService.record({
      userId: user.id,
      action: 'EMPLOYEE:UPDATE',
      resourceType: 'employees',
      resourceId: id,
      metadata: { changes: Object.keys(dto) },
      request: req,
    });
    return saved;
  }
}
