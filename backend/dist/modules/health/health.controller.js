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
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const module_registry_service_1 = require("../../common/services/module-registry.service");
let HealthController = class HealthController {
    constructor(dataSource, moduleRegistry) {
        this.dataSource = dataSource;
        this.moduleRegistry = moduleRegistry;
    }
    liveness() {
        return {
            status: 'ok',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
        };
    }
    async readiness() {
        await this.dataSource.query('SELECT 1');
        return {
            status: 'ok',
            database: 'connected',
            timestamp: new Date().toISOString(),
        };
    }
    async modules() {
        return {
            enabledCount: this.moduleRegistry.getEnabledCount(),
            totalCount: this.moduleRegistry.getModules().length,
            modules: this.moduleRegistry.getModules(),
            timestamp: new Date().toISOString(),
        };
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Liveness: el API responde' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "liveness", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('db'),
    (0, swagger_1.ApiOperation)({ summary: 'Readiness: verifica conexión con PostgreSQL' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "readiness", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('modules'),
    (0, swagger_1.ApiOperation)({ summary: 'Estado de módulos del ERP' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "modules", null);
exports.HealthController = HealthController = __decorate([
    (0, swagger_1.ApiTags)('Health'),
    (0, common_1.Controller)('health'),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource,
        module_registry_service_1.ModuleRegistryService])
], HealthController);
//# sourceMappingURL=health.controller.js.map