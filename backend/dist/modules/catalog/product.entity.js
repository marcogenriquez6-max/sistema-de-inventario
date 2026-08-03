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
exports.Product = void 0;
const typeorm_1 = require("typeorm");
const swagger_1 = require("@nestjs/swagger");
const product_code_entity_1 = require("./product-code.entity");
const product_compat_entity_1 = require("./product-compat.entity");
let Product = class Product {
};
exports.Product = Product;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Product.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'FA-001' }),
    (0, typeorm_1.Column)({ length: 50, unique: true }),
    __metadata("design:type", String)
], Product.prototype, "sku", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '15400-PLM-A02' }),
    (0, typeorm_1.Column)({
        type: 'varchar',
        name: 'oem_code',
        length: 50,
        nullable: true,
        unique: true,
    }),
    __metadata("design:type", Object)
], Product.prototype, "oemCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '7501234560017' }),
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true, unique: true }),
    __metadata("design:type", Object)
], Product.prototype, "barcode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Filtro de Aceite PH-6607' }),
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], Product.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Filtros' }),
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'varchar', length: 80, nullable: true }),
    __metadata("design:type", Object)
], Product.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Honda' }),
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'varchar', length: 80, nullable: true }),
    __metadata("design:type", Object)
], Product.prototype, "brand", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 'uds' }),
    (0, typeorm_1.Column)({ length: 20, default: 'uds' }),
    __metadata("design:type", String)
], Product.prototype, "unit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 20,
        description: 'Existencia actual (nunca negativa)',
    }),
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Product.prototype, "stock", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 5, description: 'Umbral de reposición' }),
    (0, typeorm_1.Column)({ name: 'min_stock', default: 0 }),
    __metadata("design:type", Number)
], Product.prototype, "minStock", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 10.0, description: 'Precio de compra (costo)' }),
    (0, typeorm_1.Column)({
        name: 'cost_price',
        type: 'numeric',
        precision: 14,
        scale: 2,
        default: 0,
    }),
    __metadata("design:type", String)
], Product.prototype, "costPrice", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 15.0, description: 'PVP sin IVA' }),
    (0, typeorm_1.Column)({
        name: 'base_price',
        type: 'numeric',
        precision: 14,
        scale: 2,
        default: 0,
    }),
    __metadata("design:type", String)
], Product.prototype, "basePrice", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 17.4, description: 'PVP con IVA' }),
    (0, typeorm_1.Column)({
        name: 'sale_price',
        type: 'numeric',
        precision: 14,
        scale: 2,
        default: 0,
    }),
    __metadata("design:type", String)
], Product.prototype, "salePrice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Pasillo' }),
    (0, typeorm_1.Column)({
        type: 'varchar',
        name: 'warehouse_aisle',
        length: 20,
        nullable: true,
    }),
    __metadata("design:type", Object)
], Product.prototype, "warehouseAisle", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Estantería' }),
    (0, typeorm_1.Column)({
        type: 'varchar',
        name: 'warehouse_shelf',
        length: 20,
        nullable: true,
    }),
    __metadata("design:type", Object)
], Product.prototype, "warehouseShelf", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Nivel' }),
    (0, typeorm_1.Column)({
        type: 'varchar',
        name: 'warehouse_level',
        length: 20,
        nullable: true,
    }),
    __metadata("design:type", Object)
], Product.prototype, "warehouseLevel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Casilla' }),
    (0, typeorm_1.Column)({
        type: 'varchar',
        name: 'warehouse_bin',
        length: 20,
        nullable: true,
    }),
    __metadata("design:type", Object)
], Product.prototype, "warehouseBin", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, typeorm_1.Column)({ type: 'varchar', name: 'image_url', length: 300, nullable: true }),
    __metadata("design:type", Object)
], Product.prototype, "imageUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], Product.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => product_code_entity_1.ProductCode, (c) => c.product, {
        cascade: true,
        eager: true,
    }),
    __metadata("design:type", Array)
], Product.prototype, "codes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => product_compat_entity_1.ProductCompat, (c) => c.product, { cascade: true }),
    __metadata("design:type", Array)
], Product.prototype, "compat", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Product.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Product.prototype, "updatedAt", void 0);
exports.Product = Product = __decorate([
    (0, typeorm_1.Entity)('products')
], Product);
//# sourceMappingURL=product.entity.js.map