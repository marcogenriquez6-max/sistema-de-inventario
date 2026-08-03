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
exports.ProductCompat = void 0;
const typeorm_1 = require("typeorm");
const product_entity_1 = require("./product.entity");
let ProductCompat = class ProductCompat {
};
exports.ProductCompat = ProductCompat;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ProductCompat.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'product_id' }),
    __metadata("design:type", Number)
], ProductCompat.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_entity_1.Product, (p) => p.compat, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'product_id' }),
    __metadata("design:type", product_entity_1.Product)
], ProductCompat.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'vehicle_brand', length: 80 }),
    __metadata("design:type", String)
], ProductCompat.prototype, "vehicleBrand", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'vehicle_model', length: 80 }),
    __metadata("design:type", String)
], ProductCompat.prototype, "vehicleModel", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'year_from', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], ProductCompat.prototype, "yearFrom", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'year_to', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], ProductCompat.prototype, "yearTo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', name: 'engine_type', length: 80, nullable: true }),
    __metadata("design:type", Object)
], ProductCompat.prototype, "engineType", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], ProductCompat.prototype, "createdAt", void 0);
exports.ProductCompat = ProductCompat = __decorate([
    (0, typeorm_1.Entity)('product_compat')
], ProductCompat);
//# sourceMappingURL=product-compat.entity.js.map