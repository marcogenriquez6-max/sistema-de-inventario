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
exports.Account = void 0;
const typeorm_1 = require("typeorm");
const swagger_1 = require("@nestjs/swagger");
let Account = class Account {
};
exports.Account = Account;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Account.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '1101' }),
    (0, typeorm_1.Column)({ length: 20, unique: true }),
    __metadata("design:type", String)
], Account.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Caja General' }),
    (0, typeorm_1.Column)({ length: 150 }),
    __metadata("design:type", String)
], Account.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] }),
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ length: 15 }),
    __metadata("design:type", String)
], Account.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Cuenta padre (jerarquía)' }),
    (0, typeorm_1.Column)({ type: 'int', name: 'parent_id', nullable: true }),
    __metadata("design:type", Object)
], Account.prototype, "parentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], Account.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Account.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Account.prototype, "updatedAt", void 0);
exports.Account = Account = __decorate([
    (0, typeorm_1.Entity)('chart_of_accounts')
], Account);
//# sourceMappingURL=account.entity.js.map