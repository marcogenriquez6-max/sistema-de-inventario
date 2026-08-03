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
exports.CatalogService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_entity_1 = require("./product.entity");
const product_code_entity_1 = require("./product-code.entity");
const product_compat_entity_1 = require("./product-compat.entity");
const pricing_service_1 = require("../pricing/pricing.service");
const domain_exceptions_1 = require("../../common/domain-exceptions");
const paginated_interface_1 = require("../../common/interfaces/paginated.interface");
const audit_service_1 = require("../audit/audit.service");
let CatalogService = class CatalogService {
    constructor(productRepo, codeRepo, pricingService, auditService, dataSource) {
        this.productRepo = productRepo;
        this.codeRepo = codeRepo;
        this.pricingService = pricingService;
        this.auditService = auditService;
        this.dataSource = dataSource;
    }
    async findByCode(code) {
        const normalized = code.trim().toUpperCase();
        let product = await this.productRepo.findOne({
            where: [{ sku: code }, { oemCode: code }, { barcode: code }],
        });
        if (!product) {
            const alt = await this.codeRepo.findOne({
                where: { codeValue: normalized },
                relations: ['product'],
            });
            product = alt?.product ?? null;
        }
        return product;
    }
    async findAll(query) {
        const { page, pageSize } = query;
        const qb = this.productRepo
            .createQueryBuilder('p')
            .orderBy('p.name', 'ASC');
        if (query.q) {
            qb.andWhere(new typeorm_2.Brackets((qb2) => {
                qb2
                    .where('p.sku ILIKE :q')
                    .orWhere('p.oemCode ILIKE :q')
                    .orWhere('p.barcode ILIKE :q')
                    .orWhere('p.name ILIKE :q');
            }), { q: `%${query.q}%` });
        }
        if (query.brand) {
            qb.andWhere('p.brand ILIKE :brand', { brand: query.brand });
        }
        if (query.category) {
            qb.andWhere('p.category ILIKE :category', { category: query.category });
        }
        if (query.lowStock === 1) {
            qb.andWhere('p.stock <= p.minStock');
        }
        if (query.vehicleBrand || query.vehicleModel || query.year) {
            qb.innerJoin('p.compat', 'c');
            if (query.vehicleBrand) {
                qb.andWhere('c.vehicleBrand ILIKE :vb', { vb: query.vehicleBrand });
            }
            if (query.vehicleModel) {
                qb.andWhere('c.vehicleModel ILIKE :vm', { vm: query.vehicleModel });
            }
            if (query.year) {
                qb.andWhere('(c.yearFrom IS NULL OR c.yearFrom <= :year) AND (c.yearTo IS NULL OR c.yearTo >= :year)', {
                    year: query.year,
                });
            }
        }
        const [items, total] = await qb
            .skip((page - 1) * pageSize)
            .take(pageSize)
            .getManyAndCount();
        return (0, paginated_interface_1.toPaginated)(items, total, page, pageSize);
    }
    async findOne(id) {
        const product = await this.productRepo.findOne({
            where: { id },
            relations: ['codes', 'compat'],
        });
        if (!product) {
            throw new domain_exceptions_1.DomainException(404, 'Repuesto no encontrado');
        }
        return product;
    }
    async create(dto, user, req) {
        const basePrice = dto.basePrice ??
            (await this.pricingService.computeSuggestedBasePrice(dto.costPrice));
        const salePrice = await this.pricingService.computeSalePrice(basePrice);
        const taxRate = await this.pricingService.getTaxRate();
        const product = this.productRepo.create({
            sku: dto.sku,
            oemCode: dto.oemCode ?? null,
            barcode: dto.barcode ?? null,
            name: dto.name,
            category: dto.category ?? null,
            brand: dto.brand ?? null,
            unit: dto.unit ?? 'uds',
            stock: dto.stock ?? 0,
            minStock: dto.minStock ?? 0,
            costPrice: dto.costPrice.toFixed(2),
            basePrice: basePrice.toFixed(2),
            salePrice: salePrice.toFixed(2),
            warehouseAisle: dto.warehouseAisle ?? null,
            warehouseShelf: dto.warehouseShelf ?? null,
            warehouseLevel: dto.warehouseLevel ?? null,
            warehouseBin: dto.warehouseBin ?? null,
            compat: (dto.compat ?? []).map((c) => this.dataSource.manager.create(product_compat_entity_1.ProductCompat, {
                vehicleBrand: c.vehicleBrand,
                vehicleModel: c.vehicleModel,
                yearFrom: c.yearFrom ?? null,
                yearTo: c.yearTo ?? null,
                engineType: c.engineType ?? null,
            })),
        });
        try {
            const saved = await this.productRepo.save(product);
            await this.auditService.record({
                userId: user.id,
                action: 'PRODUCT:CREATE',
                resourceType: 'products',
                resourceId: saved.id,
                metadata: {
                    sku: dto.sku,
                    name: dto.name,
                    basePrice,
                    salePrice,
                    taxRate,
                },
                request: req,
            });
            return saved;
        }
        catch (err) {
            if (this.isUniqueViolation(err)) {
                throw new domain_exceptions_1.DomainException(409, 'Ya existe un repuesto con el mismo SKU, OEM o código de barras');
            }
            throw err;
        }
    }
    async update(id, dto, user, req) {
        const product = await this.findOne(id);
        const changed = { ...dto };
        Object.assign(product, {
            sku: dto.sku ?? product.sku,
            oemCode: dto.oemCode ?? product.oemCode,
            barcode: dto.barcode ?? product.barcode,
            name: dto.name ?? product.name,
            category: dto.category !== undefined ? dto.category : product.category,
            brand: dto.brand ?? product.brand,
            unit: dto.unit ?? product.unit,
            minStock: dto.minStock ?? product.minStock,
            warehouseAisle: dto.warehouseAisle !== undefined
                ? dto.warehouseAisle
                : product.warehouseAisle,
            warehouseShelf: dto.warehouseShelf !== undefined
                ? dto.warehouseShelf
                : product.warehouseShelf,
            warehouseLevel: dto.warehouseLevel !== undefined
                ? dto.warehouseLevel
                : product.warehouseLevel,
            warehouseBin: dto.warehouseBin !== undefined
                ? dto.warehouseBin
                : product.warehouseBin,
        });
        if (dto.costPrice !== undefined || dto.basePrice !== undefined) {
            const cost = dto.costPrice ?? Number(product.costPrice);
            const base = dto.basePrice ??
                (await this.pricingService.computeSuggestedBasePrice(cost));
            const sale = await this.pricingService.computeSalePrice(base);
            product.costPrice = cost.toFixed(2);
            product.basePrice = base.toFixed(2);
            product.salePrice = sale.toFixed(2);
        }
        if (dto.compat) {
            await this.dataSource.manager.delete(product_compat_entity_1.ProductCompat, { productId: id });
            product.compat = dto.compat.map((c) => this.dataSource.manager.create(product_compat_entity_1.ProductCompat, {
                vehicleBrand: c.vehicleBrand,
                vehicleModel: c.vehicleModel,
                yearFrom: c.yearFrom ?? null,
                yearTo: c.yearTo ?? null,
                engineType: c.engineType ?? null,
            }));
        }
        try {
            const saved = await this.productRepo.save(product);
            await this.auditService.record({
                userId: user.id,
                action: 'PRODUCT:UPDATE',
                resourceType: 'products',
                resourceId: id,
                metadata: changed,
                request: req,
            });
            return saved;
        }
        catch (err) {
            if (this.isUniqueViolation(err)) {
                throw new domain_exceptions_1.DomainException(409, 'Ya existe un repuesto con el mismo SKU, OEM o código de barras');
            }
            throw err;
        }
    }
    async remove(id, user, req) {
        const product = await this.findOne(id);
        await this.productRepo.remove(product);
        await this.auditService.record({
            userId: user.id,
            action: 'PRODUCT:DELETE',
            resourceType: 'products',
            resourceId: id,
            metadata: { sku: product.sku, name: product.name },
            request: req,
        });
    }
    async recalculateSalePrices(ids) {
        if (ids.length === 0) {
            return 0;
        }
        const taxRate = await this.pricingService.getTaxRate();
        const products = await this.productRepo.find({ where: { id: (0, typeorm_2.In)(ids) } });
        for (const p of products) {
            const sale = await this.pricingService.computeSalePrice(Number(p.basePrice), taxRate);
            p.salePrice = sale.toFixed(2);
        }
        await this.productRepo.save(products);
        return products.length;
    }
    isUniqueViolation(err) {
        const e = err;
        return e?.driverError?.code === '23505';
    }
};
exports.CatalogService = CatalogService;
exports.CatalogService = CatalogService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(1, (0, typeorm_1.InjectRepository)(product_code_entity_1.ProductCode)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        pricing_service_1.PricingService,
        audit_service_1.AuditService,
        typeorm_2.DataSource])
], CatalogService);
//# sourceMappingURL=catalog.service.js.map