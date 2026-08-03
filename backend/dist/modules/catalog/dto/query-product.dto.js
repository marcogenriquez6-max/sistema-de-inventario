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
exports.QueryProductDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const pagination_dto_1 = require("../../../common/dto/pagination.dto");
class QueryProductDto extends pagination_dto_1.PaginationDto {
}
exports.QueryProductDto = QueryProductDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Texto libre: SKU, OEM, código de barras o nombre',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], QueryProductDto.prototype, "q", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Honda' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], QueryProductDto.prototype, "brand", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Frenos' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], QueryProductDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Marca del vehículo (compatibilidad)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], QueryProductDto.prototype, "vehicleBrand", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Modelo del vehículo (compatibilidad)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], QueryProductDto.prototype, "vehicleModel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Año del vehículo' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], QueryProductDto.prototype, "year", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '1 = solo stock bajo mínimo' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], QueryProductDto.prototype, "lowStock", void 0);
//# sourceMappingURL=query-product.dto.js.map