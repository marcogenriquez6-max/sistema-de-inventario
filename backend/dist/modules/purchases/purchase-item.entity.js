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
exports.PurchaseItem = void 0;
const typeorm_1 = require("typeorm");
const product_entity_1 = require("../catalog/product.entity");
const purchase_document_entity_1 = require("./purchase-document.entity");
let PurchaseItem = class PurchaseItem {
};
exports.PurchaseItem = PurchaseItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PurchaseItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'purchase_id' }),
    __metadata("design:type", Number)
], PurchaseItem.prototype, "purchaseId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => purchase_document_entity_1.PurchaseDocument, (d) => d.items, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'purchase_id' }),
    __metadata("design:type", purchase_document_entity_1.PurchaseDocument)
], PurchaseItem.prototype, "purchase", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'product_id' }),
    __metadata("design:type", Number)
], PurchaseItem.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_entity_1.Product, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'product_id' }),
    __metadata("design:type", product_entity_1.Product)
], PurchaseItem.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'product_sku', length: 50 }),
    __metadata("design:type", String)
], PurchaseItem.prototype, "productSku", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'product_name', length: 200 }),
    __metadata("design:type", String)
], PurchaseItem.prototype, "productName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], PurchaseItem.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unit_cost', type: 'numeric', precision: 14, scale: 2 }),
    __metadata("design:type", String)
], PurchaseItem.prototype, "unitCost", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'line_total', type: 'numeric', precision: 14, scale: 2 }),
    __metadata("design:type", String)
], PurchaseItem.prototype, "lineTotal", void 0);
exports.PurchaseItem = PurchaseItem = __decorate([
    (0, typeorm_1.Entity)('purchase_items')
], PurchaseItem);
//# sourceMappingURL=purchase-item.entity.js.map