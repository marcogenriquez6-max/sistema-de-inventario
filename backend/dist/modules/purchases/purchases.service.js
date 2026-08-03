"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchasesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const purchase_document_entity_1 = require("./purchase-document.entity");
const purchase_item_entity_1 = require("./purchase-item.entity");
const product_entity_1 = require("../catalog/product.entity");
const stock_movement_entity_1 = require("../inventory/stock-movement.entity");
const pricing_service_1 = require("../pricing/pricing.service");
const settings_service_1 = require("../settings/settings.service");
const suppliers_service_1 = require("../suppliers/suppliers.service");
const domain_exceptions_1 = require("../../common/domain-exceptions");
const paginated_interface_1 = require("../../common/interfaces/paginated.interface");
const audit_service_1 = require("../audit/audit.service");
const notifications_service_1 = require("../notifications/notifications.service");
let PurchasesService = class PurchasesService {
    constructor(docRepo, itemRepo, pricingService, settingsService, suppliersService, auditService, notificationsService, dataSource) {
        this.docRepo = docRepo;
        this.itemRepo = itemRepo;
        this.pricingService = pricingService;
        this.settingsService = settingsService;
        this.suppliersService = suppliersService;
        this.auditService = auditService;
        this.notificationsService = notificationsService;
        this.dataSource = dataSource;
    }
    async create(dto, user, req) {
        const supplier = await this.suppliersService.findOne(dto.supplierId);
        const taxRate = await this.pricingService.getTaxRate();
        const docNumber = await this.nextDocNumber(user.id);
        const result = await this.dataSource.transaction(async (manager) => {
            const productIds = dto.items.map((i) => i.productId);
            const products = await manager
                .createQueryBuilder(product_entity_1.Product, 'p')
                .where('p.id IN (:...ids)', { ids: productIds })
                .setLock('pessimistic_write')
                .getMany();
            const productMap = new Map(products.map((p) => [p.id, p]));
            const items = [];
            for (const line of dto.items) {
                const product = productMap.get(line.productId);
                if (!product) {
                    throw new domain_exceptions_1.DomainException(404, `Repuesto id ${line.productId} no encontrado`);
                }
                product.stock += line.quantity;
                product.costPrice = line.unitCost.toFixed(2);
                product.basePrice = (await this.pricingService.computeSuggestedBasePrice(line.unitCost)).toFixed(2);
                product.salePrice = (await this.pricingService.computeSalePrice(Number(product.basePrice), taxRate)).toFixed(2);
                await manager.save(product_entity_1.Product, product);
                items.push(manager.create(purchase_item_entity_1.PurchaseItem, {
                    productId: product.id,
                    productSku: product.sku,
                    productName: product.name,
                    quantity: line.quantity,
                    unitCost: line.unitCost.toFixed(2),
                    lineTotal: (line.unitCost * line.quantity).toFixed(2),
                }));
            }
            const subtotal = items.reduce((acc, i) => acc + Number(i.lineTotal), 0);
            const taxAmount = this.pricingService.round(subtotal * (taxRate / 100));
            const document = manager.create(purchase_document_entity_1.PurchaseDocument, {
                docNumber,
                supplierId: supplier.id,
                supplierName: supplier.name,
                invoiceNumber: dto.invoiceNumber ?? null,
                subtotal: subtotal.toFixed(2),
                taxRate: taxRate.toFixed(2),
                taxAmount: taxAmount.toFixed(2),
                total: (subtotal + taxAmount).toFixed(2),
                status: 'RECEIVED',
                userId: user.id,
                items,
            });
            await manager.save(purchase_document_entity_1.PurchaseDocument, document);
            for (const item of items) {
                const product = productMap.get(item.productId);
                await manager.save(manager.create(stock_movement_entity_1.StockMovement, {
                    productId: item.productId,
                    movementType: 'PURCHASE',
                    quantity: item.quantity,
                    unitCost: item.unitCost,
                    unitBase: product.basePrice,
                    unitSale: product.salePrice,
                    concept: `Compra ${docNumber}`,
                    referenceType: 'PURCHASE',
                    referenceId: String(document.id),
                    userId: user.id,
                }));
            }
            await this.auditService.record({
                userId: user.id,
                action: 'PURCHASE:CREATE',
                resourceType: 'purchase_documents',
                resourceId: document.id,
                metadata: {
                    docNumber,
                    supplierId: supplier.id,
                    total: document.total,
                    items: items.length,
                },
                request: req,
            });
            return document;
        });
        await this.notificationsService.createForRoles(['ADMIN', 'MANAGER'], 'PURCHASE', `Compra registrada ${docNumber}`, `Compra por $${result.total} a ${supplier.name}`, { docNumber, total: result.total, supplierId: supplier.id });
        return result;
    }
    async findAll(query) {
        const { page, pageSize } = query;
        const qb = this.docRepo
            .createQueryBuilder('d')
            .leftJoinAndSelect('d.supplier', 's')
            .orderBy('d.createdAt', 'DESC');
        if (query.q) {
            qb.andWhere('(d.docNumber ILIKE :q OR d.supplierName ILIKE :q)', {
                q: `%${query.q}%`,
            });
        }
        const [items, total] = await qb
            .skip((page - 1) * pageSize)
            .take(pageSize)
            .getManyAndCount();
        return (0, paginated_interface_1.toPaginated)(items, total, page, pageSize);
    }
    async findOne(id) {
        const doc = await this.docRepo.findOne({
            where: { id },
            relations: ['supplier', 'items'],
        });
        if (!doc) {
            throw new domain_exceptions_1.DomainException(404, 'Documento de compra no encontrado');
        }
        return doc;
    }
    async nextDocNumber(userId) {
        const settings = await this.settingsService.get('doc_sequence');
        const sequence = settings?.value ?? {};
        const current = sequence.purchase ?? 1;
        sequence.purchase = current + 1;
        await this.settingsService.set('doc_sequence', { value: sequence }, userId);
        return `COM-${String(current).padStart(5, '0')}`;
    }
};
exports.PurchasesService = PurchasesService;
exports.PurchasesService = PurchasesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(purchase_document_entity_1.PurchaseDocument)),
    __param(1, (0, typeorm_1.InjectRepository)(purchase_item_entity_1.PurchaseItem)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        pricing_service_1.PricingService,
        settings_service_1.SettingsService,
        suppliers_service_1.SuppliersService,
        audit_service_1.AuditService,
        notifications_service_1.NotificationsService,
        typeorm_2.DataSource])
], PurchasesService);
//# sourceMappingURL=purchases.service.js.map