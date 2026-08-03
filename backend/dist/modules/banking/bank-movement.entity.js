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
exports.BankMovement = void 0;
const typeorm_1 = require("typeorm");
const bank_account_entity_1 = require("./bank-account.entity");
const user_entity_1 = require("../users/user.entity");
let BankMovement = class BankMovement {
};
exports.BankMovement = BankMovement;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], BankMovement.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'account_id' }),
    __metadata("design:type", Number)
], BankMovement.prototype, "accountId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => bank_account_entity_1.BankAccount, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'account_id' }),
    __metadata("design:type", bank_account_entity_1.BankAccount)
], BankMovement.prototype, "account", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'movement_type', length: 15 }),
    __metadata("design:type", String)
], BankMovement.prototype, "movementType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 16, scale: 2 }),
    __metadata("design:type", String)
], BankMovement.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200, nullable: true }),
    __metadata("design:type", Object)
], BankMovement.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", Number)
], BankMovement.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], BankMovement.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], BankMovement.prototype, "createdAt", void 0);
exports.BankMovement = BankMovement = __decorate([
    (0, typeorm_1.Entity)('bank_movements')
], BankMovement);
//# sourceMappingURL=bank-movement.entity.js.map