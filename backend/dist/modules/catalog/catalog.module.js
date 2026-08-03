"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const product_entity_1 = require("./product.entity");
const product_code_entity_1 = require("./product-code.entity");
const product_compat_entity_1 = require("./product-compat.entity");
const catalog_service_1 = require("./catalog.service");
const catalog_controller_1 = require("./catalog.controller");
const pricing_module_1 = require("../pricing/pricing.module");
const audit_module_1 = require("../audit/audit.module");
let CatalogModule = class CatalogModule {
};
exports.CatalogModule = CatalogModule;
exports.CatalogModule = CatalogModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([product_entity_1.Product, product_code_entity_1.ProductCode, product_compat_entity_1.ProductCompat]),
            pricing_module_1.PricingModule,
            audit_module_1.AuditModule,
        ],
        controllers: [catalog_controller_1.CatalogController],
        providers: [catalog_service_1.CatalogService],
        exports: [catalog_service_1.CatalogService],
    })
], CatalogModule);
//# sourceMappingURL=catalog.module.js.map