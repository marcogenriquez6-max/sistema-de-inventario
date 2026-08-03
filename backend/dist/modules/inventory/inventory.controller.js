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
exports.InventoryController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const inventory_service_1 = require("./inventory.service");
const stock_entry_dto_1 = require("./dto/stock-entry.dto");
const adjustment_dto_1 = require("./dto/adjustment.dto");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
let InventoryController = class InventoryController {
    constructor(inventoryService) {
        this.inventoryService = inventoryService;
    }
    async purchase(dto, user, req) {
        return this.inventoryService.registerPurchase(dto, user, req);
    }
    async adjust(dto, user, req) {
        return this.inventoryService.registerAdjustment(dto, user, req);
    }
    async kardex(productId, query) {
        return this.inventoryService.getKardex(productId, query.page, query.pageSize);
    }
};
exports.InventoryController = InventoryController;
__decorate([
    (0, common_1.Post)('purchases'),
    (0, roles_decorator_1.Roles)('INVENTORY_MANAGER', 'ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Registrar entrada de stock por compra' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [stock_entry_dto_1.StockEntryDto, Object, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "purchase", null);
__decorate([
    (0, common_1.Post)('adjustments'),
    (0, roles_decorator_1.Roles)('INVENTORY_MANAGER', 'ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Registrar ajuste/merma/devolución justificada' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [adjustment_dto_1.AdjustmentDto, Object, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "adjust", null);
__decorate([
    (0, common_1.Get)('kardex/:productId'),
    (0, roles_decorator_1.Roles)('ADMIN', 'INVENTORY_MANAGER', 'MANAGER', 'AUDITOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Kardex (trazabilidad) de un repuesto' }),
    __param(0, (0, common_1.Param)('productId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, pagination_dto_1.PaginationDto]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "kardex", null);
exports.InventoryController = InventoryController = __decorate([
    (0, swagger_1.ApiTags)('Inventario'),
    (0, common_1.Controller)('inventory'),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService])
], InventoryController);
//# sourceMappingURL=inventory.controller.js.map