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
exports.BankAccount = void 0;
const typeorm_1 = require("typeorm");
const swagger_1 = require("@nestjs/swagger");
let BankAccount = class BankAccount {
};
exports.BankAccount = BankAccount;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], BankAccount.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'BANCO UNIÓN CTA 001' }),
    (0, typeorm_1.Column)({ length: 150 }),
    __metadata("design:type", String)
], BankAccount.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Banco Unión' }),
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], BankAccount.prototype, "bank", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'SAVINGS',
        enum: ['SAVINGS', 'CHECKING', 'FIXED'],
    }),
    (0, typeorm_1.Column)({ name: 'account_type', length: 15, default: 'SAVINGS' }),
    __metadata("design:type", String)
], BankAccount.prototype, "accountType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '1000001234567' }),
    (0, typeorm_1.Column)({
        type: 'varchar',
        name: 'account_number',
        length: 50,
        nullable: true,
    }),
    __metadata("design:type", Object)
], BankAccount.prototype, "accountNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'BOB' }),
    (0, typeorm_1.Column)({ length: 10, default: 'BOB' }),
    __metadata("design:type", String)
], BankAccount.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Saldo actual' }),
    (0, typeorm_1.Column)({ type: 'numeric', precision: 16, scale: 2, default: '0' }),
    __metadata("design:type", String)
], BankAccount.prototype, "balance", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: true }),
    (0, typeorm_1.Column)({ name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], BankAccount.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], BankAccount.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], BankAccount.prototype, "updatedAt", void 0);
exports.BankAccount = BankAccount = __decorate([
    (0, typeorm_1.Entity)('bank_accounts')
], BankAccount);
//# sourceMappingURL=bank-account.entity.js.map