import { Repository } from 'typeorm';
import { Supplier } from './supplier.entity';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Paginated } from '../../common/interfaces/paginated.interface';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import { Request } from 'express';
export declare class SuppliersService {
    private readonly supplierRepo;
    private readonly auditService;
    constructor(supplierRepo: Repository<Supplier>, auditService: AuditService);
    findAll(query: PaginationDto & {
        q?: string;
    }): Promise<Paginated<Supplier>>;
    findOne(id: number): Promise<Supplier>;
    create(dto: CreateSupplierDto, user: AuthUser, req: Request): Promise<Supplier>;
    update(id: number, dto: UpdateSupplierDto, user: AuthUser, req: Request): Promise<Supplier>;
}
