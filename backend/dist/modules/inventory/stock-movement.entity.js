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
exports.StockMovement = void 0;
const typeorm_1 = require("typeorm");
const product_entity_1 = require("../catalog/product.entity");
const user_entity_1 = require("../users/user.entity");
let StockMovement = class StockMovement {
};
exports.StockMovement = StockMovement;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], StockMovement.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'product_id' }),
    __metadata("design:type", Number)
], StockMovement.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_entity_1.Product, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'product_id' }),
    __metadata("design:type", product_entity_1.Product)
], StockMovement.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'movement_type', length: 20 }),
    __metadata("design:type", String)
], StockMovement.prototype, "movementType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], StockMovement.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unit_cost', type: 'numeric', precision: 14, scale: 2 }),
    __metadata("design:type", String)
], StockMovement.prototype, "unitCost", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unit_base', type: 'numeric', precision: 14, scale: 2 }),
    __metadata("design:type", String)
], StockMovement.prototype, "unitBase", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unit_sale', type: 'numeric', precision: 14, scale: 2 }),
    __metadata("design:type", String)
], StockMovement.prototype, "unitSale", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200, nullable: true }),
    __metadata("design:type", Object)
], StockMovement.prototype, "concept", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        name: 'reference_type',
        length: 30,
        nullable: true,
    }),
    __metadata("design:type", Object)
], StockMovement.prototype, "referenceType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reference_id', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], StockMovement.prototype, "referenceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'user_id', nullable: true }),
    __metadata("design:type", Object)
], StockMovement.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", Object)
], StockMovement.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], StockMovement.prototype, "createdAt", void 0);
exports.StockMovement = StockMovement = __decorate([
    (0, typeorm_1.Entity)('stock_movements')
], StockMovement);
//# sourceMappingURL=stock-movement.entity.js.map