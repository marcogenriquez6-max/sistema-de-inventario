import { Repository } from 'typeorm';
import { Customer } from './customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { Paginated } from '../../common/interfaces/paginated.interface';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import { Request } from 'express';
export declare class CustomersService {
    private readonly customerRepo;
    private readonly auditService;
    constructor(customerRepo: Repository<Customer>, auditService: AuditService);
    findAll(query: QueryCustomerDto): Promise<Paginated<Customer>>;
    findOne(id: number): Promise<Customer>;
    create(dto: CreateCustomerDto, user: AuthUser, req: Request): Promise<Customer>;
    update(id: number, dto: UpdateCustomerDto, user: AuthUser, req: Request): Promise<Customer>;
}
