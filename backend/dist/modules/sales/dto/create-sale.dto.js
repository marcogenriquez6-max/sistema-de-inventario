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
exports.CreateSaleDto = exports.SaleItemDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class SaleItemDto {
}
exports.SaleItemDto = SaleItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Id del producto' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], SaleItemDto.prototype, "productId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], SaleItemDto.prototype, "quantity", void 0);
class CreateSaleDto {
}
exports.CreateSaleDto = CreateSaleDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['NOTA', 'FACTURA'], default: 'NOTA' }),
    (0, class_validator_1.IsIn)(['NOTA', 'FACTURA']),
    __metadata("design:type", String)
], CreateSaleDto.prototype, "docType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Juan Pérez' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateSaleDto.prototype, "customerName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '12345678' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(30),
    __metadata("design:type", String)
], CreateSaleDto.prototype, "customerDoc", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [SaleItemDto], minItems: 1 }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => SaleItemDto),
    __metadata("design:type", Array)
], CreateSaleDto.prototype, "items", void 0);
//# sourceMappingURL=create-sale.dto.js.map