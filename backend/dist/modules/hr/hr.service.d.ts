import { Repository } from 'typeorm';
import { Employee } from './employee.entity';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Paginated } from '../../common/interfaces/paginated.interface';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import { Request } from 'express';
export declare class HrService {
    private readonly empRepo;
    private readonly auditService;
    constructor(empRepo: Repository<Employee>, auditService: AuditService);
    findAll(query: PaginationDto & {
        q?: string;
        department?: string;
    }): Promise<Paginated<Employee>>;
    findOne(id: number): Promise<Employee>;
    create(dto: CreateEmployeeDto, user: AuthUser, req: Request): Promise<Employee>;
    update(id: number, dto: UpdateEmployeeDto, user: AuthUser, req: Request): Promise<Employee>;
}
