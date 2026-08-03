import { Request } from 'express';
import { HrService } from './hr.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { AuthUser } from '../../common/decorators/current-user.decorator';
export declare class HrController {
    private readonly hrService;
    constructor(hrService: HrService);
    findAll(query: PaginationDto & {
        q?: string;
        department?: string;
    }): Promise<import("../../common/interfaces/paginated.interface").Paginated<import("./employee.entity").Employee>>;
    findOne(id: number): Promise<import("./employee.entity").Employee>;
    create(dto: CreateEmployeeDto, user: AuthUser, req: Request): Promise<import("./employee.entity").Employee>;
    update(id: number, dto: UpdateEmployeeDto, user: AuthUser, req: Request): Promise<import("./employee.entity").Employee>;
}
