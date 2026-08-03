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
exports.SalesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_entity_1 = require("../catalog/product.entity");
const sale_document_entity_1 = require("./sale-document.entity");
const sale_item_entity_1 = require("./sale-item.entity");
const pricing_service_1 = require("../pricing/pricing.service");
const settings_service_1 = require("../settings/settings.service");
const domain_exceptions_1 = require("../../common/domain-exceptions");
const paginated_interface_1 = require("../../common/interfaces/paginated.interface");
const audit_service_1 = require("../audit/audit.service");
const stock_movement_entity_1 = require("../inventory/stock-movement.entity");
const notifications_service_1 = require("../notifications/notifications.service");
let SalesService = class SalesService {
    constructor(documentRepo, itemRepo, pricingService, settingsService, auditService, notificationsService, dataSource) {
        this.documentRepo = documentRepo;
        this.itemRepo = itemRepo;
        this.pricingService = pricingService;
        this.settingsService = settingsService;
        this.auditService = auditService;
        this.notificationsService = notificationsService;
        this.dataSource = dataSource;
    }
    async createSale(dto, user, req) {
        const taxRate = await this.pricingService.getTaxRate();
        const docNumber = await this.nextDocumentNumber(dto.docType, user.id);
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
                if (!product.isActive) {
                    throw new domain_exceptions_1.DomainException(409, `Repuesto ${product.sku} está inactivo`);
                }
                if (product.stock < line.quantity) {
                    throw new domain_exceptions_1.DomainException(409, `Stock insuficiente de "${product.name}"`, {
                        sku: product.sku,
                        available: product.stock,
                        requested: line.quantity,
                    });
                }
                const unitBase = Number(product.basePrice);
                const unitSale = Number(product.salePrice);
                const unitCost = Number(product.costPrice);
                const taxAmount = this.pricingService.round(unitSale - unitBase);
                items.push(manager.create(sale_item_entity_1.SaleItem, {
                    productId: product.id,
                    productSku: product.sku,
                    productName: product.name,
                    quantity: line.quantity,
                    unitCost: unitCost.toFixed(2),
                    unitBase: unitBase.toFixed(2),
                    unitSale: unitSale.toFixed(2),
                    taxRate: taxRate.toFixed(2),
                    taxAmount: (taxAmount * line.quantity).toFixed(2),
                    lineTotal: (unitSale * line.quantity).toFixed(2),
                }));
            }
            for (const line of dto.items) {
                const product = productMap.get(line.productId);
                product.stock -= line.quantity;
                await manager.save(product_entity_1.Product, product);
            }
            const subtotal = items.reduce((acc, i) => acc + Number(i.unitBase) * Number(i.quantity), 0);
            const taxTotal = items.reduce((acc, i) => acc + Number(i.taxAmount), 0);
            const total = subtotal + taxTotal;
            const document = manager.create(sale_document_entity_1.SaleDocument, {
                docType: dto.docType,
                docNumber,
                customerName: dto.customerName,
                customerDoc: dto.customerDoc ?? null,
                subtotal: subtotal.toFixed(2),
                taxRate: taxRate.toFixed(2),
                taxAmount: taxTotal.toFixed(2),
                total: total.toFixed(2),
                status: 'COMPLETED',
                userId: user.id,
                items,
            });
            await manager.save(sale_document_entity_1.SaleDocument, document);
            for (const item of items) {
                await manager.save(manager.create(stock_movement_entity_1.StockMovement, {
                    productId: item.productId,
                    movementType: 'SALE',
                    quantity: -item.quantity,
                    unitCost: item.unitCost,
                    unitBase: item.unitBase,
                    unitSale: item.unitSale,
                    concept: `${dto.docType} ${docNumber}`,
                    referenceType: 'SALE',
                    referenceId: String(document.id),
                    userId: user.id,
                }));
            }
            await this.auditService.record({
                userId: user.id,
                action: 'SALE:CREATE',
                resourceType: 'sale_documents',
                resourceId: document.id,
                metadata: {
                    docNumber,
                    docType: dto.docType,
                    total,
                    items: items.length,
                },
                request: req,
            });
            return { document };
        });
        const docTotal = Number(result.document.total) || 0;
        await this.notificationsService.createForRoles(['ADMIN', 'MANAGER'], 'SALE', `Nueva venta ${docNumber}`, `Venta ${dto.docType} ${docNumber} por $${docTotal.toFixed(2)} — ${result.document.items.length} línea(s)`, { docNumber, total: docTotal.toFixed(2), docType: dto.docType, userId: user.id });
        return result;
    }
    async findAll(query) {
        const { page, pageSize } = query;
        const qb = this.documentRepo
            .createQueryBuilder('d')
            .leftJoinAndSelect('d.user', 'user')
            .orderBy('d.createdAt', 'DESC');
        if (query.docType) {
            qb.andWhere('d.docType = :docType', { docType: query.docType });
        }
        if (query.status) {
            qb.andWhere('d.status = :status', { status: query.status });
        }
        if (query.from) {
            qb.andWhere('d.createdAt >= :from', { from: new Date(query.from) });
        }
        if (query.to) {
            qb.andWhere('d.createdAt <= :to', { to: new Date(query.to) });
        }
        if (query.q) {
            qb.andWhere('(d.docNumber ILIKE :q OR d.customerName ILIKE :q)', {
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
        const doc = await this.documentRepo.findOne({
            where: { id },
            relations: ['user', 'items'],
        });
        if (!doc) {
            throw new domain_exceptions_1.DomainException(404, 'Documento de venta no encontrado');
        }
        return doc;
    }
    async voidDocument(id, reason, user, req) {
        const doc = await this.findOne(id);
        if (doc.status === 'VOIDED') {
            throw new domain_exceptions_1.DomainException(409, 'El documento ya está anulado');
        }
        doc.status = 'VOIDED';
        doc.voidReason = reason;
        const saved = await this.documentRepo.save(doc);
        await this.auditService.record({
            userId: user.id,
            action: 'SALE:VOID',
            resourceType: 'sale_documents',
            resourceId: id,
            metadata: { docNumber: doc.docNumber, reason },
            request: req,
        });
        return saved;
    }
    async nextDocumentNumber(docType, userId) {
        const prefix = docType === 'FACTURA' ? 'FAC' : 'NOT';
        const settings = await this.settingsService.get('doc_sequence');
        const sequence = settings?.value ?? { nota: 1, factura: 1 };
        const current = docType === 'FACTURA' ? sequence.factura : sequence.nota;
        sequence[docType === 'FACTURA' ? 'factura' : 'nota'] = current + 1;
        await this.settingsService.set('doc_sequence', { value: sequence }, userId);
        return `${prefix}-${String(current).padStart(5, '0')}`;
    }
};
exports.SalesService = SalesService;
exports.SalesService = SalesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(sale_document_entity_1.SaleDocument)),
    __param(1, (0, typeorm_1.InjectRepository)(sale_item_entity_1.SaleItem)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        pricing_service_1.PricingService,
        settings_service_1.SettingsService,
        audit_service_1.AuditService,
        notifications_service_1.NotificationsService,
        typeorm_2.DataSource])
], SalesService);
//# sourceMappingURL=sales.service.js.map