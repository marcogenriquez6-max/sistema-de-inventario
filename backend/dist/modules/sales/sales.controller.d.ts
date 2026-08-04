import { Request, Response } from 'express';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { QuerySaleDto } from './dto/query-sale.dto';
import { AuthUser } from '../../common/decorators/current-user.decorator';
declare class VoidSaleDto {
    reason: string;
}
export declare class SalesController {
    private readonly salesService;
    constructor(salesService: SalesService);
    create(dto: CreateSaleDto, user: AuthUser, req: Request): Promise<import("./sales.service").SaleResult>;
    findAll(query: QuerySaleDto): Promise<import("../../common/interfaces/paginated.interface").Paginated<import("./sale-document.entity").SaleDocument>>;
    findOne(id: number): Promise<import("./sale-document.entity").SaleDocument>;
    pdf(id: number, res: Response): Promise<void>;
    void(id: number, dto: VoidSaleDto, user: AuthUser, req: Request): Promise<import("./sale-document.entity").SaleDocument>;
}
export {};
