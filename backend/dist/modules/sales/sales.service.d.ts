import { DataSource, Repository } from 'typeorm';
import { SaleDocument } from './sale-document.entity';
import { SaleItem } from './sale-item.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { PricingService } from '../pricing/pricing.service';
import { SettingsService } from '../settings/settings.service';
import { Paginated } from '../../common/interfaces/paginated.interface';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Request } from 'express';
export interface SaleResult {
    document: SaleDocument;
}
export declare class SalesService {
    private readonly documentRepo;
    private readonly itemRepo;
    private readonly pricingService;
    private readonly settingsService;
    private readonly auditService;
    private readonly notificationsService;
    private readonly dataSource;
    constructor(documentRepo: Repository<SaleDocument>, itemRepo: Repository<SaleItem>, pricingService: PricingService, settingsService: SettingsService, auditService: AuditService, notificationsService: NotificationsService, dataSource: DataSource);
    createSale(dto: CreateSaleDto, user: AuthUser, req: Request): Promise<SaleResult>;
    findAll(query: {
        page: number;
        pageSize: number;
        docType?: string;
        status?: string;
        from?: string;
        to?: string;
        q?: string;
    }): Promise<Paginated<SaleDocument>>;
    findOne(id: number): Promise<SaleDocument>;
    pdfInvoice(id: number): Promise<Buffer>;
    voidDocument(id: number, reason: string, user: AuthUser, req: Request): Promise<SaleDocument>;
    private nextDocumentNumber;
}
