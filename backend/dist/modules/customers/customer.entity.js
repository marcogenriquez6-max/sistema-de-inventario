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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Customer = void 0;
const typeorm_1 = require("typeorm");
const swagger_1 = require("@nestjs/swagger");
let Customer = class Customer {
};
exports.Customer = Customer;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Customer.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'CLI-00001' }),
    (0, typeorm_1.Column)({ length: 30, unique: true }),
    __metadata("design:type", String)
], Customer.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Juan Pérez' }),
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], Customer.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'CI', enum: ['CI', 'RUC', 'PASSPORT'] }),
    (0, typeorm_1.Column)({
        type: 'varchar',
        name: 'document_type',
        length: 10,
        nullable: true,
    }),
    __metadata("design:type", Object)
], Customer.prototype, "documentType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '12345678' }),
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({
        type: 'varchar',
        name: 'document_number',
        length: 30,
        nullable: true,
    }),
    __metadata("design:type", Object)
], Customer.prototype, "documentNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'cliente@correo.com' }),
    (0, typeorm_1.Column)({ type: 'varchar', length: 150, nullable: true }),
    __metadata("design:type", Object)
], Customer.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '+591 71234567' }),
    (0, typeorm_1.Column)({ type: 'varchar', length: 30, nullable: true }),
    __metadata("design:type", Object)
], Customer.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], Customer.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: true }),
    (0, typeorm_1.Column)({ name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], Customer.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Customer.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Customer.prototype, "updatedAt", void 0);
exports.Customer = Customer = __decorate([
    (0, typeorm_1.Entity)('customers')
], Customer);
//# sourceMappingURL=customer.entity.js.map