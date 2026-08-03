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
exports.CustomersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const customers_service_1 = require("./customers.service");
const create_customer_dto_1 = require("./dto/create-customer.dto");
const update_customer_dto_1 = require("./dto/update-customer.dto");
const query_customer_dto_1 = require("./dto/query-customer.dto");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let CustomersController = class CustomersController {
    constructor(customersService) {
        this.customersService = customersService;
    }
    async findAll(query) {
        return this.customersService.findAll(query);
    }
    async findOne(id) {
        return this.customersService.findOne(id);
    }
    async create(dto, user, req) {
        return this.customersService.create(dto, user, req);
    }
    async update(id, dto, user, req) {
        return this.customersService.update(id, dto, user, req);
    }
};
exports.CustomersController = CustomersController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'SELLER', 'MANAGER', 'INVENTORY_MANAGER'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar/buscar clientes (paginado)' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_customer_dto_1.QueryCustomerDto]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'SELLER', 'MANAGER'),
    (0, swagger_1.ApiOperation)({ summary: 'Detalle de cliente' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'SELLER'),
    (0, swagger_1.ApiOperation)({ summary: 'Crear cliente' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_customer_dto_1.CreateCustomerDto, Object, Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'SELLER'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar cliente' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_customer_dto_1.UpdateCustomerDto, Object, Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "update", null);
exports.CustomersController = CustomersController = __decorate([
    (0, swagger_1.ApiTags)('Clientes'),
    (0, common_1.Controller)('customers'),
    __metadata("design:paramtypes", [customers_service_1.CustomersService])
], CustomersController);
//# sourceMappingURL=customers.controller.js.map