import { Request } from 'express';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { AuthUser } from '../../common/decorators/current-user.decorator';
export declare class SuppliersController {
    private readonly suppliersService;
    constructor(suppliersService: SuppliersService);
    findAll(query: PaginationDto & {
        q?: string;
    }): Promise<import("../../common/interfaces/paginated.interface").Paginated<import("./supplier.entity").Supplier>>;
    findOne(id: number): Promise<import("./supplier.entity").Supplier>;
    create(dto: CreateSupplierDto, user: AuthUser, req: Request): Promise<import("./supplier.entity").Supplier>;
    update(id: number, dto: UpdateSupplierDto, user: AuthUser, req: Request): Promise<import("./supplier.entity").Supplier>;
}
