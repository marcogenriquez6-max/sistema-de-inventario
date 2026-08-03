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
exports.PublicApiController = exports.PublicSearchDto = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_entity_1 = require("../catalog/product.entity");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const throttler_1 = require("@nestjs/throttler");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class PublicSearchDto {
}
exports.PublicSearchDto = PublicSearchDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PublicSearchDto.prototype, "q", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PublicSearchDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(50),
    __metadata("design:type", Number)
], PublicSearchDto.prototype, "pageSize", void 0);
let PublicApiController = class PublicApiController {
    constructor(productRepo) {
        this.productRepo = productRepo;
    }
    async products(query) {
        const page = Math.max(1, Number(query.page ?? 1));
        const pageSize = Math.min(50, Math.max(1, Number(query.pageSize ?? 20)));
        const qb = this.productRepo
            .createQueryBuilder('p')
            .where('p.isActive = true')
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
        const [items, total] = await qb
            .skip((page - 1) * pageSize)
            .take(pageSize)
            .getManyAndCount();
        return {
            items: items.map((p) => ({
                id: p.id,
                sku: p.sku,
                oemCode: p.oemCode,
                name: p.name,
                brand: p.brand,
                category: p.category,
                stock: p.stock,
                salePrice: p.salePrice,
                warehouseAisle: p.warehouseAisle,
                warehouseShelf: p.warehouseShelf,
                warehouseLevel: p.warehouseLevel,
                warehouseBin: p.warehouseBin,
            })),
            meta: {
                page,
                pageSize,
                totalItems: total,
                totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
            },
        };
    }
    status() {
        return {
            service: 'sistema-repuestos-api',
            version: '1.0.0',
            status: 'operational',
        };
    }
};
exports.PublicApiController = PublicApiController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('products'),
    (0, throttler_1.Throttle)({ default: { limit: 30, ttl: 60000 } }),
    (0, swagger_1.ApiOperation)({ summary: 'Búsqueda pública de repuestos (paginada)' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [PublicSearchDto]),
    __metadata("design:returntype", Promise)
], PublicApiController.prototype, "products", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('status'),
    (0, swagger_1.ApiOperation)({ summary: 'Estado del servicio (público)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PublicApiController.prototype, "status", null);
exports.PublicApiController = PublicApiController = __decorate([
    (0, swagger_1.ApiTags)('API Pública'),
    (0, common_1.Controller)('public'),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PublicApiController);
//# sourceMappingURL=public-api.controller.js.map