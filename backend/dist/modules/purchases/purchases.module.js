"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchasesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const purchase_document_entity_1 = require("./purchase-document.entity");
const purchase_item_entity_1 = require("./purchase-item.entity");
const purchases_service_1 = require("./purchases.service");
const purchases_controller_1 = require("./purchases.controller");
const pricing_module_1 = require("../pricing/pricing.module");
const settings_module_1 = require("../settings/settings.module");
const suppliers_module_1 = require("../suppliers/suppliers.module");
const audit_module_1 = require("../audit/audit.module");
const notifications_module_1 = require("../notifications/notifications.module");
let PurchasesModule = class PurchasesModule {
};
exports.PurchasesModule = PurchasesModule;
exports.PurchasesModule = PurchasesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([purchase_document_entity_1.PurchaseDocument, purchase_item_entity_1.PurchaseItem]),
            pricing_module_1.PricingModule,
            settings_module_1.SettingsModule,
            suppliers_module_1.SuppliersModule,
            audit_module_1.AuditModule,
            notifications_module_1.NotificationsModule,
        ],
        controllers: [purchases_controller_1.PurchasesController],
        providers: [purchases_service_1.PurchasesService],
        exports: [purchases_service_1.PurchasesService],
    })
], PurchasesModule);
//# sourceMappingURL=purchases.module.js.map