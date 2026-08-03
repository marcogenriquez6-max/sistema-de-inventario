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
exports.CompatEntryDto = exports.CreateProductDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CompatEntryDto {
}
exports.CompatEntryDto = CompatEntryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Honda' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], CompatEntryDto.prototype, "vehicleBrand", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Civic' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], CompatEntryDto.prototype, "vehicleModel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 2016 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CompatEntryDto.prototype, "yearFrom", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 2021 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CompatEntryDto.prototype, "yearTo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '1.8L' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], CompatEntryDto.prototype, "engineType", void 0);
class CreateProductDto {
}
exports.CreateProductDto = CreateProductDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'FA-001' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreateProductDto.prototype, "sku", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '15400-PLM-A02' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreateProductDto.prototype, "oemCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '7501234560017' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreateProductDto.prototype, "barcode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Filtro de Aceite PH-6607' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateProductDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Filtros' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], CreateProductDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Honda' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], CreateProductDto.prototype, "brand", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 'uds' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], CreateProductDto.prototype, "unit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 10.0, description: 'Precio de compra (costo)' }),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "costPrice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 15.0,
        description: 'PVP sin IVA. Si se omite, se calcula con el margen global.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "basePrice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 5,
        description: 'Stock inicial (0 por defecto)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "stock", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 5 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "minStock", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'A', description: 'Pasillo' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], CreateProductDto.prototype, "warehouseAisle", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '1', description: 'Estantería' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], CreateProductDto.prototype, "warehouseShelf", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2', description: 'Nivel' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], CreateProductDto.prototype, "warehouseLevel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '1', description: 'Casilla' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], CreateProductDto.prototype, "warehouseBin", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [CompatEntryDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CompatEntryDto),
    __metadata("design:type", Array)
], CreateProductDto.prototype, "compat", void 0);
//# sourceMappingURL=create-product.dto.js.map