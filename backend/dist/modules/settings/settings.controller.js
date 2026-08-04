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
exports.SettingsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const settings_service_1 = require("./settings.service");
const update_setting_dto_1 = require("./dto/update-setting.dto");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const require_module_decorator_1 = require("../../common/decorators/require-module.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const audit_service_1 = require("../audit/audit.service");
let SettingsController = class SettingsController {
    constructor(settingsService, auditService) {
        this.settingsService = settingsService;
        this.auditService = auditService;
    }
    async getAll() {
        return this.settingsService.getAll();
    }
    async update(key, dto, user, req) {
        const result = await this.settingsService.set(key, dto.value, user.id);
        await this.auditService.record({
            userId: user.id,
            action: 'SETTING:UPDATE',
            resourceType: 'settings',
            resourceId: key,
            metadata: { value: dto.value },
            request: req,
        });
        return result;
    }
    async getPublic(key) {
        const value = await this.settingsService.get(key);
        if (value === null || value === undefined) {
            throw new common_1.NotFoundException(`Parámetro "${key}" no encontrado`);
        }
        return { key, value };
    }
    async history(key) {
        return this.settingsService.getHistory(key);
    }
};
exports.SettingsController = SettingsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar parámetros globales (solo ADMIN)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getAll", null);
__decorate([
    (0, common_1.Patch)(':key'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar parámetro global (versión el cambio)' }),
    __param(0, (0, common_1.Param)('key')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_setting_dto_1.UpdateSettingDto, Object, Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "update", null);
__decorate([
    (0, common_1.Get)('public/:key'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Leer parámetro público (ej: tax_rate para POS)' }),
    __param(0, (0, common_1.Param)('key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getPublic", null);
__decorate([
    (0, common_1.Get)('history/:key'),
    (0, roles_decorator_1.Roles)('ADMIN', 'AUDITOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Historial de cambios de un parámetro' }),
    __param(0, (0, common_1.Param)('key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "history", null);
exports.SettingsController = SettingsController = __decorate([
    (0, swagger_1.ApiTags)('Configuración'),
    (0, require_module_decorator_1.RequireModule)('settings'),
    (0, common_1.Controller)('settings'),
    __metadata("design:paramtypes", [settings_service_1.SettingsService,
        audit_service_1.AuditService])
], SettingsController);
//# sourceMappingURL=settings.controller.js.map