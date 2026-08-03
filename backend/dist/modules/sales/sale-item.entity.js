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
exports.SaleItem = void 0;
const typeorm_1 = require("typeorm");
const product_entity_1 = require("../catalog/product.entity");
const sale_document_entity_1 = require("./sale-document.entity");
let SaleItem = class SaleItem {
};
exports.SaleItem = SaleItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], SaleItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'sale_id' }),
    __metadata("design:type", Number)
], SaleItem.prototype, "saleId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sale_document_entity_1.SaleDocument, (d) => d.items, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'sale_id' }),
    __metadata("design:type", sale_document_entity_1.SaleDocument)
], SaleItem.prototype, "sale", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'product_id' }),
    __metadata("design:type", Number)
], SaleItem.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_entity_1.Product, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'product_id' }),
    __metadata("design:type", product_entity_1.Product)
], SaleItem.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'product_sku', length: 50 }),
    __metadata("design:type", String)
], SaleItem.prototype, "productSku", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'product_name', length: 200 }),
    __metadata("design:type", String)
], SaleItem.prototype, "productName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], SaleItem.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unit_cost', type: 'numeric', precision: 14, scale: 2 }),
    __metadata("design:type", String)
], SaleItem.prototype, "unitCost", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unit_base', type: 'numeric', precision: 14, scale: 2 }),
    __metadata("design:type", String)
], SaleItem.prototype, "unitBase", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unit_sale', type: 'numeric', precision: 14, scale: 2 }),
    __metadata("design:type", String)
], SaleItem.prototype, "unitSale", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tax_rate', type: 'numeric', precision: 5, scale: 2 }),
    __metadata("design:type", String)
], SaleItem.prototype, "taxRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tax_amount', type: 'numeric', precision: 14, scale: 2 }),
    __metadata("design:type", String)
], SaleItem.prototype, "taxAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'line_total', type: 'numeric', precision: 14, scale: 2 }),
    __metadata("design:type", String)
], SaleItem.prototype, "lineTotal", void 0);
exports.SaleItem = SaleItem = __decorate([
    (0, typeorm_1.Entity)('sale_items')
], SaleItem);
//# sourceMappingURL=sale-item.entity.js.map