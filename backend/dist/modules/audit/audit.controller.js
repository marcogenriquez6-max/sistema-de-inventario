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
exports.AuditController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const audit_service_1 = require("./audit.service");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const paginated_interface_1 = require("../../common/interfaces/paginated.interface");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class QueryAuditDto extends pagination_dto_1.PaginationDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], QueryAuditDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryAuditDto.prototype, "action", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryAuditDto.prototype, "resourceType", void 0);
let AuditController = class AuditController {
    constructor(auditService) {
        this.auditService = auditService;
    }
    async findAll(query) {
        const { items, total } = await this.auditService.findAll(query);
        return (0, paginated_interface_1.toPaginated)(items, total, query.page, query.pageSize);
    }
};
exports.AuditController = AuditController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'AUDITOR'),
    (0, swagger_1.ApiOperation)({
        summary: 'Listar registros de auditoría (solo ADMIN/AUDITOR)',
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [QueryAuditDto]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "findAll", null);
exports.AuditController = AuditController = __decorate([
    (0, swagger_1.ApiTags)('Auditoría'),
    (0, common_1.Controller)('audit'),
    __metadata("design:paramtypes", [audit_service_1.AuditService])
], AuditController);
//# sourceMappingURL=audit.controller.js.map