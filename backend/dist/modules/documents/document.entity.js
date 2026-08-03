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
exports.DocumentRecord = void 0;
const typeorm_1 = require("typeorm");
const swagger_1 = require("@nestjs/swagger");
let DocumentRecord = class DocumentRecord {
};
exports.DocumentRecord = DocumentRecord;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], DocumentRecord.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'factura-334455.pdf' }),
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], DocumentRecord.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'PDF',
        enum: ['PDF', 'IMAGE', 'XLSX', 'DOCX', 'OTHER'],
    }),
    (0, typeorm_1.Column)({ name: 'file_type', length: 20, default: 'OTHER' }),
    __metadata("design:type", String)
], DocumentRecord.prototype, "fileType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Compras' }),
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'varchar', length: 80, nullable: true }),
    __metadata("design:type", Object)
], DocumentRecord.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Ruta dentro del volumen de archivos' }),
    (0, typeorm_1.Column)({ type: 'varchar', name: 'file_path', length: 500, nullable: true }),
    __metadata("design:type", Object)
], DocumentRecord.prototype, "filePath", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Entidad referenciada: SALE/PURCHASE/EMPLOYEE/OTHER',
    }),
    (0, typeorm_1.Column)({
        type: 'varchar',
        name: 'reference_type',
        length: 30,
        nullable: true,
    }),
    __metadata("design:type", Object)
], DocumentRecord.prototype, "referenceType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reference_id', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], DocumentRecord.prototype, "referenceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'uploaded_by', nullable: true }),
    __metadata("design:type", Object)
], DocumentRecord.prototype, "uploadedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", Object)
], DocumentRecord.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], DocumentRecord.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], DocumentRecord.prototype, "updatedAt", void 0);
exports.DocumentRecord = DocumentRecord = __decorate([
    (0, typeorm_1.Entity)('documents')
], DocumentRecord);
//# sourceMappingURL=document.entity.js.map