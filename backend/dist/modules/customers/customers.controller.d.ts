import { Request } from 'express';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { AuthUser } from '../../common/decorators/current-user.decorator';
export declare class CustomersController {
    private readonly customersService;
    constructor(customersService: CustomersService);
    findAll(query: QueryCustomerDto): Promise<import("../../common/interfaces/paginated.interface").Paginated<import("./customer.entity").Customer>>;
    findOne(id: number): Promise<import("./customer.entity").Customer>;
    create(dto: CreateCustomerDto, user: AuthUser, req: Request): Promise<import("./customer.entity").Customer>;
    update(id: number, dto: UpdateCustomerDto, user: AuthUser, req: Request): Promise<import("./customer.entity").Customer>;
}
