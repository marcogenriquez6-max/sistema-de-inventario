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
exports.PurchaseDocument = void 0;
const typeorm_1 = require("typeorm");
const supplier_entity_1 = require("../suppliers/supplier.entity");
const purchase_item_entity_1 = require("./purchase-item.entity");
let PurchaseDocument = class PurchaseDocument {
};
exports.PurchaseDocument = PurchaseDocument;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PurchaseDocument.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'doc_number', length: 30, unique: true }),
    __metadata("design:type", String)
], PurchaseDocument.prototype, "docNumber", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'supplier_id' }),
    __metadata("design:type", Number)
], PurchaseDocument.prototype, "supplierId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => supplier_entity_1.Supplier, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'supplier_id' }),
    __metadata("design:type", supplier_entity_1.Supplier)
], PurchaseDocument.prototype, "supplier", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'supplier_name', length: 200 }),
    __metadata("design:type", String)
], PurchaseDocument.prototype, "supplierName", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        name: 'invoice_number',
        length: 50,
        nullable: true,
    }),
    __metadata("design:type", Object)
], PurchaseDocument.prototype, "invoiceNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 14, scale: 2 }),
    __metadata("design:type", String)
], PurchaseDocument.prototype, "subtotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tax_rate', type: 'numeric', precision: 5, scale: 2 }),
    __metadata("design:type", String)
], PurchaseDocument.prototype, "taxRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tax_amount', type: 'numeric', precision: 14, scale: 2 }),
    __metadata("design:type", String)
], PurchaseDocument.prototype, "taxAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 14, scale: 2 }),
    __metadata("design:type", String)
], PurchaseDocument.prototype, "total", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: 'RECEIVED' }),
    __metadata("design:type", String)
], PurchaseDocument.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', name: 'void_reason', length: 200, nullable: true }),
    __metadata("design:type", Object)
], PurchaseDocument.prototype, "voidReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", Number)
], PurchaseDocument.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => purchase_item_entity_1.PurchaseItem, (i) => i.purchase, { cascade: true }),
    __metadata("design:type", Array)
], PurchaseDocument.prototype, "items", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], PurchaseDocument.prototype, "createdAt", void 0);
exports.PurchaseDocument = PurchaseDocument = __decorate([
    (0, typeorm_1.Entity)('purchase_documents')
], PurchaseDocument);
//# sourceMappingURL=purchase-document.entity.js.map