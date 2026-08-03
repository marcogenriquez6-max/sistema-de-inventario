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
exports.DocumentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const documents_service_1 = require("./documents.service");
const create_document_dto_1 = require("./dto/create-document.dto");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let DocumentsController = class DocumentsController {
    constructor(documentsService) {
        this.documentsService = documentsService;
    }
    async findAll(query) {
        return this.documentsService.findAll(query);
    }
    async findOne(id) {
        return this.documentsService.findOne(id);
    }
    async create(dto, user, req) {
        return this.documentsService.create(dto, user, req);
    }
    async remove(id, user, req) {
        await this.documentsService.remove(id, user, req);
    }
};
exports.DocumentsController = DocumentsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER', 'AUDITOR', 'INVENTORY_MANAGER'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar/buscar documentos' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER', 'AUDITOR', 'INVENTORY_MANAGER'),
    (0, swagger_1.ApiOperation)({ summary: 'Detalle de documento' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'INVENTORY_MANAGER'),
    (0, common_1.HttpCode)(201),
    (0, swagger_1.ApiOperation)({ summary: 'Registrar documento (metadatos)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_document_dto_1.CreateDocumentDto, Object, Object]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "create", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, common_1.HttpCode)(204),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar registro de documento' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "remove", null);
exports.DocumentsController = DocumentsController = __decorate([
    (0, swagger_1.ApiTags)('Documentos'),
    (0, common_1.Controller)('documents'),
    __metadata("design:paramtypes", [documents_service_1.DocumentsService])
], DocumentsController);
//# sourceMappingURL=documents.controller.js.map