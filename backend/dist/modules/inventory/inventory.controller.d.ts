import { Request } from 'express';
import { InventoryService } from './inventory.service';
import { StockEntryDto } from './dto/stock-entry.dto';
import { AdjustmentDto } from './dto/adjustment.dto';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    purchase(dto: StockEntryDto, user: AuthUser, req: Request): Promise<import("./stock-movement.entity").StockMovement[]>;
    adjust(dto: AdjustmentDto, user: AuthUser, req: Request): Promise<import("./stock-movement.entity").StockMovement>;
    kardex(productId: number, query: PaginationDto): Promise<import("../../common/interfaces/paginated.interface").Paginated<import("./stock-movement.entity").StockMovement>>;
}
