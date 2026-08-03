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
exports.Employee = void 0;
const typeorm_1 = require("typeorm");
const swagger_1 = require("@nestjs/swagger");
let Employee = class Employee {
};
exports.Employee = Employee;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Employee.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'EMP-00001' }),
    (0, typeorm_1.Column)({ length: 30, unique: true }),
    __metadata("design:type", String)
], Employee.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Ana Condori' }),
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'full_name', length: 150 }),
    __metadata("design:type", String)
], Employee.prototype, "fullName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '1234567 LP' }),
    (0, typeorm_1.Column)({
        type: 'varchar',
        name: 'document_number',
        length: 30,
        nullable: true,
    }),
    __metadata("design:type", Object)
], Employee.prototype, "documentNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Vendedora' }),
    (0, typeorm_1.Column)({ type: 'varchar', length: 80, nullable: true }),
    __metadata("design:type", Object)
], Employee.prototype, "position", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Ventas' }),
    (0, typeorm_1.Column)({ type: 'varchar', length: 80, nullable: true }),
    __metadata("design:type", Object)
], Employee.prototype, "department", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '+591 70022334' }),
    (0, typeorm_1.Column)({ type: 'varchar', length: 30, nullable: true }),
    __metadata("design:type", Object)
], Employee.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'ana@empresa.com' }),
    (0, typeorm_1.Column)({ type: 'varchar', length: 150, nullable: true }),
    __metadata("design:type", Object)
], Employee.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2024-01-15' }),
    (0, typeorm_1.Column)({ name: 'hire_date', type: 'date', nullable: true }),
    __metadata("design:type", Object)
], Employee.prototype, "hireDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 3500.0 }),
    (0, typeorm_1.Column)({ type: 'numeric', precision: 12, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], Employee.prototype, "salary", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: true }),
    (0, typeorm_1.Column)({ name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], Employee.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Employee.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Employee.prototype, "updatedAt", void 0);
exports.Employee = Employee = __decorate([
    (0, typeorm_1.Entity)('employees')
], Employee);
//# sourceMappingURL=employee.entity.js.map