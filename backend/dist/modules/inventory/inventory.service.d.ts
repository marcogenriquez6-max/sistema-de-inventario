import { DataSource, Repository } from 'typeorm';
import { StockMovement } from './stock-movement.entity';
import { StockEntryDto } from './dto/stock-entry.dto';
import { AdjustmentDto } from './dto/adjustment.dto';
import { PricingService } from '../pricing/pricing.service';
import { Paginated } from '../../common/interfaces/paginated.interface';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Request } from 'express';
export declare class InventoryService {
    private readonly movementRepo;
    private readonly pricingService;
    private readonly auditService;
    private readonly notificationsService;
    private readonly dataSource;
    constructor(movementRepo: Repository<StockMovement>, pricingService: PricingService, auditService: AuditService, notificationsService: NotificationsService, dataSource: DataSource);
    registerPurchase(dto: StockEntryDto, user: AuthUser, req: Request): Promise<StockMovement[]>;
    registerAdjustment(dto: AdjustmentDto, user: AuthUser, req: Request): Promise<StockMovement>;
    getKardex(productId: number, page: number, pageSize: number): Promise<Paginated<StockMovement>>;
}
