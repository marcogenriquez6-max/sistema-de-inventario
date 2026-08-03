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
exports.AccountingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const accounting_service_1 = require("./accounting.service");
const accounting_dto_1 = require("./dto/accounting.dto");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let AccountingController = class AccountingController {
    constructor(accountingService) {
        this.accountingService = accountingService;
    }
    async accounts() {
        return this.accountingService.listAccounts();
    }
    async createAccount(dto, user, req) {
        return this.accountingService.createAccount(dto, user, req);
    }
    async createEntry(dto, user, req) {
        return this.accountingService.createEntry(dto, user, req);
    }
    async listEntries(query) {
        return this.accountingService.listEntries(query.page, query.pageSize);
    }
    async entry(id) {
        return this.accountingService.findOne(id);
    }
    async trialBalance() {
        return this.accountingService.trialBalance();
    }
};
exports.AccountingController = AccountingController;
__decorate([
    (0, common_1.Get)('accounts'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER', 'AUDITOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Plan de cuentas' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AccountingController.prototype, "accounts", null);
__decorate([
    (0, common_1.Post)('accounts'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, common_1.HttpCode)(201),
    (0, swagger_1.ApiOperation)({ summary: 'Crear cuenta contable' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [accounting_dto_1.CreateAccountDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AccountingController.prototype, "createAccount", null);
__decorate([
    (0, common_1.Post)('entries'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER'),
    (0, common_1.HttpCode)(201),
    (0, swagger_1.ApiOperation)({ summary: 'Registrar asiento de diario (debe cuadrar)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [accounting_dto_1.CreateJournalEntryDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AccountingController.prototype, "createEntry", null);
__decorate([
    (0, common_1.Get)('entries'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER', 'AUDITOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar asientos (paginado)' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_dto_1.PaginationDto]),
    __metadata("design:returntype", Promise)
], AccountingController.prototype, "listEntries", null);
__decorate([
    (0, common_1.Get)('entries/:id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER', 'AUDITOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Detalle de asiento con líneas' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AccountingController.prototype, "entry", null);
__decorate([
    (0, common_1.Get)('trial-balance'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER', 'AUDITOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Balance de comprobación por cuenta' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AccountingController.prototype, "trialBalance", null);
exports.AccountingController = AccountingController = __decorate([
    (0, swagger_1.ApiTags)('Contabilidad'),
    (0, common_1.Controller)('accounting'),
    __metadata("design:paramtypes", [accounting_service_1.AccountingService])
], AccountingController);
//# sourceMappingURL=accounting.controller.js.map