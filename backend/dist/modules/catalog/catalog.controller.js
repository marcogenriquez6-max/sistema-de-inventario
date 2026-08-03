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
exports.CatalogController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const catalog_service_1 = require("./catalog.service");
const create_product_dto_1 = require("./dto/create-product.dto");
const update_product_dto_1 = require("./dto/update-product.dto");
const query_product_dto_1 = require("./dto/query-product.dto");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let CatalogController = class CatalogController {
    constructor(catalogService) {
        this.catalogService = catalogService;
    }
    async findByCode(code) {
        return this.catalogService.findByCode(code);
    }
    async findAll(query) {
        return this.catalogService.findAll(query);
    }
    async findOne(id) {
        return this.catalogService.findOne(id);
    }
    async create(dto, user, req) {
        return this.catalogService.create(dto, user, req);
    }
    async update(id, dto, user, req) {
        return this.catalogService.update(id, dto, user, req);
    }
    async remove(id, user, req) {
        await this.catalogService.remove(id, user, req);
    }
};
exports.CatalogController = CatalogController;
__decorate([
    (0, common_1.Get)('by-code/:code'),
    (0, swagger_1.ApiOperation)({
        summary: 'Buscar por código exacto (SKU, OEM o código de barras)',
    }),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "findByCode", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar/filtrar repuestos (paginado)' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_product_dto_1.QueryProductDto]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Ficha completa de un repuesto' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('INVENTORY_MANAGER', 'ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Crear repuesto (solo inventario/admin)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_product_dto_1.CreateProductDto, Object, Object]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('INVENTORY_MANAGER', 'ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar repuesto (solo inventario/admin)' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_product_dto_1.UpdateProductDto, Object, Object]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, common_1.HttpCode)(204),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar repuesto (solo admin)' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "remove", null);
exports.CatalogController = CatalogController = __decorate([
    (0, swagger_1.ApiTags)('Catálogo'),
    (0, common_1.Controller)('products'),
    __metadata("design:paramtypes", [catalog_service_1.CatalogService])
], CatalogController);
//# sourceMappingURL=catalog.controller.js.map