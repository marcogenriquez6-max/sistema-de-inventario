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
exports.QuerySaleDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const pagination_dto_1 = require("../../../common/dto/pagination.dto");
class QuerySaleDto extends pagination_dto_1.PaginationDto {
}
exports.QuerySaleDto = QuerySaleDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['NOTA', 'FACTURA'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['NOTA', 'FACTURA']),
    __metadata("design:type", String)
], QuerySaleDto.prototype, "docType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['COMPLETED', 'VOIDED'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['COMPLETED', 'VOIDED']),
    __metadata("design:type", String)
], QuerySaleDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-08-01' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QuerySaleDto.prototype, "from", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-08-31' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QuerySaleDto.prototype, "to", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Número de documento o cliente' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], QuerySaleDto.prototype, "q", void 0);
//# sourceMappingURL=query-sale.dto.js.map