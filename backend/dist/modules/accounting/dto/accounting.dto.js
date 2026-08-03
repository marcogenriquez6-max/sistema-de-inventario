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
exports.CreateAccountDto = exports.CreateJournalEntryDto = exports.JournalLineDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class JournalLineDto {
}
exports.JournalLineDto = JournalLineDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Id de la cuenta' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], JournalLineDto.prototype, "accountId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Débito (0 si es solo crédito)' }),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], JournalLineDto.prototype, "debit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Crédito (0 si es solo débito)' }),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], JournalLineDto.prototype, "credit", void 0);
class CreateJournalEntryDto {
}
exports.CreateJournalEntryDto = CreateJournalEntryDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '2026-08-03',
        description: 'Fecha del asiento (YYYY-MM-DD)',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateJournalEntryDto.prototype, "date", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Asiento de venta FAC-00001' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateJournalEntryDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'SALE' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(30),
    __metadata("design:type", String)
], CreateJournalEntryDto.prototype, "referenceType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '1' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(30),
    __metadata("design:type", String)
], CreateJournalEntryDto.prototype, "referenceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [JournalLineDto],
        minItems: 2,
        description: 'Debe cuadrar: suma débitos = suma créditos',
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(2),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => JournalLineDto),
    __metadata("design:type", Array)
], CreateJournalEntryDto.prototype, "lines", void 0);
class CreateAccountDto {
}
exports.CreateAccountDto = CreateAccountDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '1101' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], CreateAccountDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Caja General' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(150),
    __metadata("design:type", String)
], CreateAccountDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(15),
    __metadata("design:type", String)
], CreateAccountDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Id de cuenta padre' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateAccountDto.prototype, "parentId", void 0);
//# sourceMappingURL=accounting.dto.js.map