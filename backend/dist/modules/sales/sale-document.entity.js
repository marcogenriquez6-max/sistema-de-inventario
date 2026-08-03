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
exports.SaleDocument = void 0;
const typeorm_1 = require("typeorm");
const swagger_1 = require("@nestjs/swagger");
const user_entity_1 = require("../users/user.entity");
const sale_item_entity_1 = require("./sale-item.entity");
let SaleDocument = class SaleDocument {
};
exports.SaleDocument = SaleDocument;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], SaleDocument.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['NOTA', 'FACTURA'] }),
    (0, typeorm_1.Column)({ name: 'doc_type', length: 20 }),
    __metadata("design:type", String)
], SaleDocument.prototype, "docType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'FAC-00001' }),
    (0, typeorm_1.Column)({ name: 'doc_number', length: 30, unique: true }),
    __metadata("design:type", String)
], SaleDocument.prototype, "docNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Cliente General' }),
    (0, typeorm_1.Column)({ name: 'customer_name', length: 200 }),
    __metadata("design:type", String)
], SaleDocument.prototype, "customerName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '12345678' }),
    (0, typeorm_1.Column)({ type: 'varchar', name: 'customer_doc', length: 30, nullable: true }),
    __metadata("design:type", Object)
], SaleDocument.prototype, "customerDoc", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 42.0 }),
    (0, typeorm_1.Column)({ type: 'numeric', precision: 14, scale: 2 }),
    __metadata("design:type", String)
], SaleDocument.prototype, "subtotal", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 16.0 }),
    (0, typeorm_1.Column)({ name: 'tax_rate', type: 'numeric', precision: 5, scale: 2 }),
    __metadata("design:type", String)
], SaleDocument.prototype, "taxRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 6.72 }),
    (0, typeorm_1.Column)({ name: 'tax_amount', type: 'numeric', precision: 14, scale: 2 }),
    __metadata("design:type", String)
], SaleDocument.prototype, "taxAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 48.72 }),
    (0, typeorm_1.Column)({ type: 'numeric', precision: 14, scale: 2 }),
    __metadata("design:type", String)
], SaleDocument.prototype, "total", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: 'COMPLETED' }),
    __metadata("design:type", String)
], SaleDocument.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', name: 'void_reason', length: 200, nullable: true }),
    __metadata("design:type", Object)
], SaleDocument.prototype, "voidReason", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", Number)
], SaleDocument.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], SaleDocument.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => sale_item_entity_1.SaleItem, (i) => i.sale, { cascade: true }),
    __metadata("design:type", Array)
], SaleDocument.prototype, "items", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], SaleDocument.prototype, "createdAt", void 0);
exports.SaleDocument = SaleDocument = __decorate([
    (0, typeorm_1.Entity)('sale_documents')
], SaleDocument);
//# sourceMappingURL=sale-document.entity.js.map