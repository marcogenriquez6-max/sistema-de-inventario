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
exports.SalesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const sales_service_1 = require("./sales.service");
const create_sale_dto_1 = require("./dto/create-sale.dto");
const query_sale_dto_1 = require("./dto/query-sale.dto");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const class_validator_1 = require("class-validator");
class VoidSaleDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], VoidSaleDto.prototype, "reason", void 0);
let SalesController = class SalesController {
    constructor(salesService) {
        this.salesService = salesService;
    }
    async create(dto, user, req) {
        return this.salesService.createSale(dto, user, req);
    }
    async findAll(query) {
        return this.salesService.findAll(query);
    }
    async findOne(id) {
        return this.salesService.findOne(id);
    }
    async void(id, dto, user, req) {
        return this.salesService.voidDocument(id, dto.reason, user, req);
    }
};
exports.SalesController = SalesController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('SELLER', 'ADMIN', 'INVENTORY_MANAGER'),
    (0, swagger_1.ApiOperation)({
        summary: 'Ejecutar venta (nota o factura) con descuento atómico de stock',
    }),
    (0, common_1.HttpCode)(201),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_sale_dto_1.CreateSaleDto, Object, Object]),
    __metadata("design:returntype", Promise)
], SalesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER', 'AUDITOR', 'SELLER'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar documentos de venta (paginado + filtros)' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_sale_dto_1.QuerySaleDto]),
    __metadata("design:returntype", Promise)
], SalesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER', 'AUDITOR', 'SELLER'),
    (0, swagger_1.ApiOperation)({ summary: 'Detalle de documento con ítems' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], SalesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/void'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Anular documento (solo admin)' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, VoidSaleDto, Object, Object]),
    __metadata("design:returntype", Promise)
], SalesController.prototype, "void", null);
exports.SalesController = SalesController = __decorate([
    (0, swagger_1.ApiTags)('Ventas (POS)'),
    (0, common_1.Controller)('sales'),
    __metadata("design:paramtypes", [sales_service_1.SalesService])
], SalesController);
//# sourceMappingURL=sales.controller.js.map