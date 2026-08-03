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
exports.BankingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const banking_service_1 = require("./banking.service");
const banking_dto_1 = require("./dto/banking.dto");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let BankingController = class BankingController {
    constructor(bankingService) {
        this.bankingService = bankingService;
    }
    async accounts() {
        return this.bankingService.listAccounts();
    }
    async createAccount(dto, user, req) {
        return this.bankingService.createAccount(dto, user, req);
    }
    async addMovement(id, dto, user, req) {
        return this.bankingService.addMovement(id, dto, user, req);
    }
    async transfer(id, dto, user, req) {
        await this.bankingService.transfer(id, dto, user, req);
        return { ok: true };
    }
    async movements(id, query) {
        return this.bankingService.movements(id, query.page, query.pageSize);
    }
};
exports.BankingController = BankingController;
__decorate([
    (0, common_1.Get)('accounts'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER', 'AUDITOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Cuentas bancarias' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BankingController.prototype, "accounts", null);
__decorate([
    (0, common_1.Post)('accounts'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, common_1.HttpCode)(201),
    (0, swagger_1.ApiOperation)({ summary: 'Crear cuenta bancaria' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [banking_dto_1.CreateBankAccountDto, Object, Object]),
    __metadata("design:returntype", Promise)
], BankingController.prototype, "createAccount", null);
__decorate([
    (0, common_1.Post)('accounts/:id/movements'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER'),
    (0, swagger_1.ApiOperation)({ summary: 'Depósito o retiro en cuenta' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, banking_dto_1.BankMovementDto, Object, Object]),
    __metadata("design:returntype", Promise)
], BankingController.prototype, "addMovement", null);
__decorate([
    (0, common_1.Post)('accounts/:id/transfer'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Transferencia entre cuentas' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, banking_dto_1.TransferDto, Object, Object]),
    __metadata("design:returntype", Promise)
], BankingController.prototype, "transfer", null);
__decorate([
    (0, common_1.Get)('accounts/:id/movements'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER', 'AUDITOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Movimientos de una cuenta' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, pagination_dto_1.PaginationDto]),
    __metadata("design:returntype", Promise)
], BankingController.prototype, "movements", null);
exports.BankingController = BankingController = __decorate([
    (0, swagger_1.ApiTags)('Bancos y Tesorería'),
    (0, common_1.Controller)('banking'),
    __metadata("design:paramtypes", [banking_service_1.BankingService])
], BankingController);
//# sourceMappingURL=banking.controller.js.map