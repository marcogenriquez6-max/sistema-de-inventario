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
exports.AdjustmentDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class AdjustmentDto {
}
exports.AdjustmentDto = AdjustmentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Id del producto' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], AdjustmentDto.prototype, "productId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['ADJUST', 'MERMA', 'RETURN'] }),
    (0, class_validator_1.IsIn)(['ADJUST', 'MERMA', 'RETURN']),
    __metadata("design:type", String)
], AdjustmentDto.prototype, "movementType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Cantidad. Positiva = entrada, negativa = salida',
    }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], AdjustmentDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Repuesto dañado en almacén' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], AdjustmentDto.prototype, "concept", void 0);
//# sourceMappingURL=adjustment.dto.js.map