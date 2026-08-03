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
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_entity_1 = require("../catalog/product.entity");
const stock_movement_entity_1 = require("./stock-movement.entity");
const pricing_service_1 = require("../pricing/pricing.service");
const domain_exceptions_1 = require("../../common/domain-exceptions");
const paginated_interface_1 = require("../../common/interfaces/paginated.interface");
const audit_service_1 = require("../audit/audit.service");
const notifications_service_1 = require("../notifications/notifications.service");
let InventoryService = class InventoryService {
    constructor(movementRepo, pricingService, auditService, notificationsService, dataSource) {
        this.movementRepo = movementRepo;
        this.pricingService = pricingService;
        this.auditService = auditService;
        this.notificationsService = notificationsService;
        this.dataSource = dataSource;
    }
    async registerPurchase(dto, user, req) {
        const movements = [];
        const taxRate = await this.pricingService.getTaxRate();
        await this.dataSource.transaction(async (manager) => {
            for (const item of dto.items) {
                const product = await manager.findOne(product_entity_1.Product, {
                    where: { id: item.productId },
                    lock: { mode: 'pessimistic_write' },
                });
                if (!product) {
                    throw new domain_exceptions_1.DomainException(404, `Repuesto id ${item.productId} no encontrado`);
                }
                product.stock += item.quantity;
                product.costPrice = item.unitCost.toFixed(2);
                product.basePrice = (await this.pricingService.computeSuggestedBasePrice(item.unitCost)).toFixed(2);
                product.salePrice = (await this.pricingService.computeSalePrice(Number(product.basePrice), taxRate)).toFixed(2);
                await manager.save(product_entity_1.Product, product);
                const movement = manager.create(stock_movement_entity_1.StockMovement, {
                    productId: product.id,
                    movementType: 'PURCHASE',
                    quantity: item.quantity,
                    unitCost: item.unitCost.toFixed(2),
                    unitBase: product.basePrice,
                    unitSale: product.salePrice,
                    concept: dto.concept ?? 'Compra a proveedor',
                    referenceType: 'PURCHASE',
                    userId: user.id,
                });
                await manager.save(stock_movement_entity_1.StockMovement, movement);
                movements.push(movement);
            }
        });
        await this.auditService.record({
            userId: user.id,
            action: 'STOCK:PURCHASE',
            resourceType: 'stock',
            metadata: { items: dto.items, concept: dto.concept },
            request: req,
        });
        return movements;
    }
    async registerAdjustment(dto, user, req) {
        const taxRate = await this.pricingService.getTaxRate();
        let movement;
        await this.dataSource.transaction(async (manager) => {
            const product = await manager.findOne(product_entity_1.Product, {
                where: { id: dto.productId },
                lock: { mode: 'pessimistic_write' },
            });
            if (!product) {
                throw new domain_exceptions_1.DomainException(404, 'Repuesto no encontrado');
            }
            const newStock = product.stock + dto.quantity;
            if (newStock < 0) {
                throw new domain_exceptions_1.DomainException(409, `Stock insuficiente. Disponible: ${product.stock}`, {
                    available: product.stock,
                    requested: dto.quantity,
                });
            }
            product.stock = newStock;
            await manager.save(product_entity_1.Product, product);
            movement = manager.create(stock_movement_entity_1.StockMovement, {
                productId: product.id,
                movementType: dto.movementType,
                quantity: dto.quantity,
                unitCost: product.costPrice,
                unitBase: product.basePrice,
                unitSale: (await this.pricingService.computeSalePrice(Number(product.basePrice), taxRate)).toFixed(2),
                concept: dto.concept ?? null,
                referenceType: 'ADJUSTMENT',
                userId: user.id,
            });
            await manager.save(stock_movement_entity_1.StockMovement, movement);
        });
        await this.auditService.record({
            userId: user.id,
            action: `STOCK:${dto.movementType}`,
            resourceType: 'stock',
            resourceId: dto.productId,
            metadata: { quantity: dto.quantity, concept: dto.concept },
            request: req,
        });
        if (dto.quantity < 0 && movement.productId) {
            const product = await this.dataSource
                .getRepository(product_entity_1.Product)
                .findOneBy({ id: movement.productId });
            if (product && product.stock <= product.minStock) {
                await this.notificationsService.createForRoles(['INVENTORY_MANAGER', 'ADMIN'], 'LOW_STOCK', `Stock bajo: ${product.name}`, `Quedan ${product.stock} unidad(es); umbral de reposición ${product.minStock}. (SKU ${product.sku})`, { productId: product.id, sku: product.sku, stock: product.stock, minStock: product.minStock });
            }
        }
        return movement;
    }
    async getKardex(productId, page, pageSize) {
        const [items, total] = await this.movementRepo.findAndCount({
            where: { productId },
            relations: ['user'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });
        return (0, paginated_interface_1.toPaginated)(items, total, page, pageSize);
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(stock_movement_entity_1.StockMovement)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        pricing_service_1.PricingService,
        audit_service_1.AuditService,
        notifications_service_1.NotificationsService,
        typeorm_2.DataSource])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map