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
exports.TransferDto = exports.BankMovementDto = exports.CreateBankAccountDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateBankAccountDto {
}
exports.CreateBankAccountDto = CreateBankAccountDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'CTA Operativa' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(150),
    __metadata("design:type", String)
], CreateBankAccountDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Banco Unión' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateBankAccountDto.prototype, "bank", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['SAVINGS', 'CHECKING', 'FIXED'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['SAVINGS', 'CHECKING', 'FIXED']),
    __metadata("design:type", String)
], CreateBankAccountDto.prototype, "accountType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '1000001234567' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreateBankAccountDto.prototype, "accountNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'BOB' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(10),
    __metadata("design:type", String)
], CreateBankAccountDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Saldo inicial' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateBankAccountDto.prototype, "balance", void 0);
class BankMovementDto {
}
exports.BankMovementDto = BankMovementDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['DEPOSIT', 'WITHDRAWAL'] }),
    (0, class_validator_1.IsIn)(['DEPOSIT', 'WITHDRAWAL']),
    __metadata("design:type", String)
], BankMovementDto.prototype, "movementType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 500.0 }),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0.01),
    __metadata("design:type", Number)
], BankMovementDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Depósito cliente' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], BankMovementDto.prototype, "description", void 0);
class TransferDto {
}
exports.TransferDto = TransferDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Cuenta destino' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], TransferDto.prototype, "toAccountId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 200.0 }),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0.01),
    __metadata("design:type", Number)
], TransferDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Traspaso a caja' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], TransferDto.prototype, "description", void 0);
//# sourceMappingURL=banking.dto.js.map