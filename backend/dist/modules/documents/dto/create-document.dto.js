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
exports.CreateDocumentDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateDocumentDto {
}
exports.CreateDocumentDto = CreateDocumentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'factura-334455.pdf' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateDocumentDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['PDF', 'IMAGE', 'XLSX', 'DOCX', 'OTHER'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['PDF', 'IMAGE', 'XLSX', 'DOCX', 'OTHER']),
    __metadata("design:type", String)
], CreateDocumentDto.prototype, "fileType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Compras' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], CreateDocumentDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Ruta relativa del archivo' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateDocumentDto.prototype, "filePath", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Tipo de entidad referenciada' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(30),
    __metadata("design:type", String)
], CreateDocumentDto.prototype, "referenceType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Id de la entidad referenciada' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateDocumentDto.prototype, "referenceId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateDocumentDto.prototype, "notes", void 0);
//# sourceMappingURL=create-document.dto.js.map