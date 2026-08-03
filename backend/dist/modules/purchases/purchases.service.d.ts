import { DataSource, Repository } from 'typeorm';
import { PurchaseDocument } from './purchase-document.entity';
import { PurchaseItem } from './purchase-item.entity';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { PricingService } from '../pricing/pricing.service';
import { SettingsService } from '../settings/settings.service';
import { SuppliersService } from '../suppliers/suppliers.service';
import { Paginated } from '../../common/interfaces/paginated.interface';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Request } from 'express';
export declare class PurchasesService {
    private readonly docRepo;
    private readonly itemRepo;
    private readonly pricingService;
    private readonly settingsService;
    private readonly suppliersService;
    private readonly auditService;
    private readonly notificationsService;
    private readonly dataSource;
    constructor(docRepo: Repository<PurchaseDocument>, itemRepo: Repository<PurchaseItem>, pricingService: PricingService, settingsService: SettingsService, suppliersService: SuppliersService, auditService: AuditService, notificationsService: NotificationsService, dataSource: DataSource);
    create(dto: CreatePurchaseDto, user: AuthUser, req: Request): Promise<PurchaseDocument>;
    findAll(query: {
        page: number;
        pageSize: number;
        q?: string;
    }): Promise<Paginated<PurchaseDocument>>;
    findOne(id: number): Promise<PurchaseDocument>;
    private nextDocNumber;
}
