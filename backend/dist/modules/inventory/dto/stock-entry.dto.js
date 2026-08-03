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
exports.StockEntryDto = exports.StockEntryItemDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class StockEntryItemDto {
}
exports.StockEntryItemDto = StockEntryItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Id del producto' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], StockEntryItemDto.prototype, "productId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 50, description: 'Cantidad entrante' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], StockEntryItemDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 10.0, description: 'Costo unitario de la compra' }),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], StockEntryItemDto.prototype, "unitCost", void 0);
class StockEntryDto {
}
exports.StockEntryDto = StockEntryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Compra proveedor #456' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], StockEntryDto.prototype, "concept", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [StockEntryItemDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => StockEntryItemDto),
    __metadata("design:type", Array)
], StockEntryDto.prototype, "items", void 0);
//# sourceMappingURL=stock-entry.dto.js.map