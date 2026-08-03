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
exports.SuppliersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const suppliers_service_1 = require("./suppliers.service");
const supplier_dto_1 = require("./dto/supplier.dto");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let SuppliersController = class SuppliersController {
    constructor(suppliersService) {
        this.suppliersService = suppliersService;
    }
    async findAll(query) {
        return this.suppliersService.findAll(query);
    }
    async findOne(id) {
        return this.suppliersService.findOne(id);
    }
    async create(dto, user, req) {
        return this.suppliersService.create(dto, user, req);
    }
    async update(id, dto, user, req) {
        return this.suppliersService.update(id, dto, user, req);
    }
};
exports.SuppliersController = SuppliersController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'INVENTORY_MANAGER', 'MANAGER'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar/buscar proveedores (paginado)' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SuppliersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'INVENTORY_MANAGER', 'MANAGER'),
    (0, swagger_1.ApiOperation)({ summary: 'Detalle de proveedor' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], SuppliersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'INVENTORY_MANAGER'),
    (0, swagger_1.ApiOperation)({ summary: 'Crear proveedor' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [supplier_dto_1.CreateSupplierDto, Object, Object]),
    __metadata("design:returntype", Promise)
], SuppliersController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'INVENTORY_MANAGER'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar proveedor' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, supplier_dto_1.UpdateSupplierDto, Object, Object]),
    __metadata("design:returntype", Promise)
], SuppliersController.prototype, "update", null);
exports.SuppliersController = SuppliersController = __decorate([
    (0, swagger_1.ApiTags)('Proveedores'),
    (0, common_1.Controller)('suppliers'),
    __metadata("design:paramtypes", [suppliers_service_1.SuppliersService])
], SuppliersController);
//# sourceMappingURL=suppliers.controller.js.map