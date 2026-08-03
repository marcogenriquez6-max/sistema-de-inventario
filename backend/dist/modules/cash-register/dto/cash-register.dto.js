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
exports.CloseRegisterDto = exports.CashMovementDto = exports.OpenRegisterDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class OpenRegisterDto {
}
exports.OpenRegisterDto = OpenRegisterDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 200.0, description: 'Saldo inicial en caja' }),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], OpenRegisterDto.prototype, "initialBalance", void 0);
class CashMovementDto {
}
exports.CashMovementDto = CashMovementDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['INCOME', 'EXPENSE', 'DEPOSIT', 'WITHDRAWAL'] }),
    (0, class_validator_1.IsIn)(['INCOME', 'EXPENSE', 'DEPOSIT', 'WITHDRAWAL']),
    __metadata("design:type", String)
], CashMovementDto.prototype, "movementType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 50.0 }),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0.01),
    __metadata("design:type", Number)
], CashMovementDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Pago de luz' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CashMovementDto.prototype, "description", void 0);
class CloseRegisterDto {
}
exports.CloseRegisterDto = CloseRegisterDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1250.75, description: 'Conteo físico de la caja' }),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CloseRegisterDto.prototype, "countedAmount", void 0);
//# sourceMappingURL=cash-register.dto.js.map