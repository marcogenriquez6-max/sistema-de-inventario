import { Request } from 'express';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { AuthUser } from '../../common/decorators/current-user.decorator';
export declare class PurchasesController {
    private readonly purchasesService;
    constructor(purchasesService: PurchasesService);
    create(dto: CreatePurchaseDto, user: AuthUser, req: Request): Promise<import("./purchase-document.entity").PurchaseDocument>;
    findAll(query: PaginationDto & {
        q?: string;
    }): Promise<import("../../common/interfaces/paginated.interface").Paginated<import("./purchase-document.entity").PurchaseDocument>>;
    findOne(id: number): Promise<import("./purchase-document.entity").PurchaseDocument>;
}
