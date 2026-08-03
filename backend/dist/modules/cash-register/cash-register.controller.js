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
exports.CashRegisterController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const cash_register_service_1 = require("./cash-register.service");
const cash_register_dto_1 = require("./dto/cash-register.dto");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let CashRegisterController = class CashRegisterController {
    constructor(cashRegisterService) {
        this.cashRegisterService = cashRegisterService;
    }
    async open(dto, user, req) {
        return this.cashRegisterService.openRegister(dto, user, req);
    }
    async mine(user) {
        return this.cashRegisterService.getOpenRegister(user.id);
    }
    async addMovement(id, dto, user, req) {
        return this.cashRegisterService.addMovement(id, dto, user, req);
    }
    async movements(id, query) {
        return this.cashRegisterService.getMovements(id, query.page, query.pageSize);
    }
    async close(id, dto, user, req) {
        return this.cashRegisterService.closeRegister(id, dto, user, req);
    }
};
exports.CashRegisterController = CashRegisterController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'SELLER'),
    (0, common_1.HttpCode)(201),
    (0, swagger_1.ApiOperation)({ summary: 'Abrir caja' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [cash_register_dto_1.OpenRegisterDto, Object, Object]),
    __metadata("design:returntype", Promise)
], CashRegisterController.prototype, "open", null);
__decorate([
    (0, common_1.Get)('mine'),
    (0, roles_decorator_1.Roles)('ADMIN', 'SELLER'),
    (0, swagger_1.ApiOperation)({ summary: 'Mi caja abierta actual' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CashRegisterController.prototype, "mine", null);
__decorate([
    (0, common_1.Post)(':id/movements'),
    (0, roles_decorator_1.Roles)('ADMIN', 'SELLER'),
    (0, swagger_1.ApiOperation)({ summary: 'Registrar movimiento de caja' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, cash_register_dto_1.CashMovementDto, Object, Object]),
    __metadata("design:returntype", Promise)
], CashRegisterController.prototype, "addMovement", null);
__decorate([
    (0, common_1.Get)(':id/movements'),
    (0, roles_decorator_1.Roles)('ADMIN', 'SELLER', 'MANAGER', 'AUDITOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Movimientos de una caja' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, pagination_dto_1.PaginationDto]),
    __metadata("design:returntype", Promise)
], CashRegisterController.prototype, "movements", null);
__decorate([
    (0, common_1.Post)(':id/close'),
    (0, roles_decorator_1.Roles)('ADMIN', 'SELLER'),
    (0, swagger_1.ApiOperation)({ summary: 'Cerrar caja con arqueo (conteo físico)' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, cash_register_dto_1.CloseRegisterDto, Object, Object]),
    __metadata("design:returntype", Promise)
], CashRegisterController.prototype, "close", null);
exports.CashRegisterController = CashRegisterController = __decorate([
    (0, swagger_1.ApiTags)('Caja'),
    (0, common_1.Controller)('cash-registers'),
    __metadata("design:paramtypes", [cash_register_service_1.CashRegisterService])
], CashRegisterController);
//# sourceMappingURL=cash-register.controller.js.map