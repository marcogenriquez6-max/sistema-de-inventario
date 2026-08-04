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
exports.ExportController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const export_service_1 = require("./export.service");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const require_module_decorator_1 = require("../../common/decorators/require-module.decorator");
let ExportController = class ExportController {
    constructor(exportService) {
        this.exportService = exportService;
    }
    formats() {
        return {
            formats: this.exportService.getFormats(),
            resources: this.exportService.getResourceNames(),
        };
    }
    async export(resource, format, q, from, to, res) {
        const { buffer, mime, extension } = await this.exportService.export(resource, format ?? 'csv', {
            q,
            from,
            to,
        });
        const name = `repuestos_${resource}_${new Date().toISOString().replace(/[:.]/g, '-')}.${extension}`;
        res.setHeader('Content-Type', mime);
        res.setHeader('Content-Disposition', `attachment; filename="${name}"; filename*=UTF-8''${encodeURIComponent(name)}`);
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.end(buffer);
    }
};
exports.ExportController = ExportController;
__decorate([
    (0, common_1.Get)('formats'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar recursos y formatos de exportación' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ExportController.prototype, "formats", null);
__decorate([
    (0, common_1.Get)(':resource'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER', 'AUDITOR', 'SELLER', 'INVENTORY_MANAGER'),
    (0, swagger_1.ApiOperation)({ summary: 'Exportar datos en CSV, XLSX o PDF' }),
    (0, swagger_1.ApiParam)({
        name: 'resource',
        example: 'products',
        description: 'Recurso a exportar',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'format',
        required: false,
        enum: ['csv', 'xlsx', 'pdf'],
        description: 'Formato (default: csv)',
    }),
    (0, swagger_1.ApiQuery)({ name: 'q', required: false, description: 'Filtro de texto' }),
    (0, swagger_1.ApiQuery)({
        name: 'from',
        required: false,
        description: 'Fecha inicial (ISO)',
    }),
    (0, swagger_1.ApiQuery)({ name: 'to', required: false, description: 'Fecha final (ISO)' }),
    __param(0, (0, common_1.Param)('resource')),
    __param(1, (0, common_1.Query)('format')),
    __param(2, (0, common_1.Query)('q')),
    __param(3, (0, common_1.Query)('from')),
    __param(4, (0, common_1.Query)('to')),
    __param(5, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], ExportController.prototype, "export", null);
exports.ExportController = ExportController = __decorate([
    (0, swagger_1.ApiTags)('Exportación'),
    (0, require_module_decorator_1.RequireModule)('export'),
    (0, common_1.Controller)('export'),
    __metadata("design:paramtypes", [export_service_1.ExportService])
], ExportController);
//# sourceMappingURL=export.controller.js.map