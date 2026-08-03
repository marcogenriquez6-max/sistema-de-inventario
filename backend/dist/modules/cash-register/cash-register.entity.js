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
exports.CashRegister = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
let CashRegister = class CashRegister {
};
exports.CashRegister = CashRegister;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], CashRegister.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'opened_by' }),
    __metadata("design:type", Number)
], CashRegister.prototype, "openedBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'opened_by' }),
    __metadata("design:type", user_entity_1.User)
], CashRegister.prototype, "opener", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'initial_balance',
        type: 'numeric',
        precision: 14,
        scale: 2,
        default: '0',
    }),
    __metadata("design:type", String)
], CashRegister.prototype, "initialBalance", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 14, scale: 2, default: '0' }),
    __metadata("design:type", String)
], CashRegister.prototype, "expected", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'counted_amount',
        type: 'numeric',
        precision: 14,
        scale: 2,
        nullable: true,
    }),
    __metadata("design:type", Object)
], CashRegister.prototype, "countedAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 14, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], CashRegister.prototype, "difference", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ length: 10, default: 'OPEN' }),
    __metadata("design:type", String)
], CashRegister.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'closed_by', nullable: true }),
    __metadata("design:type", Object)
], CashRegister.prototype, "closedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'closed_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], CashRegister.prototype, "closedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'opened_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], CashRegister.prototype, "openedAt", void 0);
exports.CashRegister = CashRegister = __decorate([
    (0, typeorm_1.Entity)('cash_registers')
], CashRegister);
//# sourceMappingURL=cash-register.entity.js.map