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
exports.PurchasesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const purchases_service_1 = require("./purchases.service");
const create_purchase_dto_1 = require("./dto/create-purchase.dto");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let PurchasesController = class PurchasesController {
    constructor(purchasesService) {
        this.purchasesService = purchasesService;
    }
    async create(dto, user, req) {
        return this.purchasesService.create(dto, user, req);
    }
    async findAll(query) {
        return this.purchasesService.findAll(query);
    }
    async findOne(id) {
        return this.purchasesService.findOne(id);
    }
};
exports.PurchasesController = PurchasesController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'INVENTORY_MANAGER'),
    (0, common_1.HttpCode)(201),
    (0, swagger_1.ApiOperation)({
        summary: 'Registrar compra (actualiza stock, costos y Kardex)',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_purchase_dto_1.CreatePurchaseDto, Object, Object]),
    __metadata("design:returntype", Promise)
], PurchasesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'INVENTORY_MANAGER', 'MANAGER', 'AUDITOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar compras (paginado)' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PurchasesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'INVENTORY_MANAGER', 'MANAGER', 'AUDITOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Detalle de compra con ítems' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PurchasesController.prototype, "findOne", null);
exports.PurchasesController = PurchasesController = __decorate([
    (0, swagger_1.ApiTags)('Compras'),
    (0, common_1.Controller)('purchases'),
    __metadata("design:paramtypes", [purchases_service_1.PurchasesService])
], PurchasesController);
//# sourceMappingURL=purchases.controller.js.map