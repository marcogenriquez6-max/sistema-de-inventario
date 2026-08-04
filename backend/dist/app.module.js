"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const env_validation_1 = require("./config/env.validation");
const database_config_1 = require("./config/database.config");
const jwt_auth_guard_1 = require("./common/guards/jwt-auth.guard");
const roles_guard_1 = require("./common/guards/roles.guard");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const settings_module_1 = require("./modules/settings/settings.module");
const catalog_module_1 = require("./modules/catalog/catalog.module");
const pricing_module_1 = require("./modules/pricing/pricing.module");
const inventory_module_1 = require("./modules/inventory/inventory.module");
const sales_module_1 = require("./modules/sales/sales.module");
const reports_module_1 = require("./modules/reports/reports.module");
const audit_module_1 = require("./modules/audit/audit.module");
const health_module_1 = require("./modules/health/health.module");
const cache_module_1 = require("./common/services/cache/cache.module");
const jobs_module_1 = require("./modules/jobs/jobs.module");
const customers_module_1 = require("./modules/customers/customers.module");
const suppliers_module_1 = require("./modules/suppliers/suppliers.module");
const purchases_module_1 = require("./modules/purchases/purchases.module");
const cash_register_module_1 = require("./modules/cash-register/cash-register.module");
const accounting_module_1 = require("./modules/accounting/accounting.module");
const documents_module_1 = require("./modules/documents/documents.module");
const hr_module_1 = require("./modules/hr/hr.module");
const banking_module_1 = require("./modules/banking/banking.module");
const public_api_module_1 = require("./modules/public-api/public-api.module");
const search_module_1 = require("./modules/search/search.module");
const export_module_1 = require("./modules/export/export.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const chat_module_1 = require("./modules/chat/chat.module");
const tasks_module_1 = require("./modules/tasks/tasks.module");
const permissions_module_1 = require("./modules/permissions/permissions.module");
const module_registry_service_1 = require("./common/services/module-registry.service");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                validationSchema: env_validation_1.envValidationSchema,
                envFilePath: ['.env', '.env.local'],
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: database_config_1.typeOrmConfig,
            }),
            throttler_1.ThrottlerModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    throttlers: [
                        {
                            ttl: config.get('THROTTLE_TTL', 60) * 1000,
                            limit: config.get('THROTTLE_LIMIT', 100),
                        },
                    ],
                }),
            }),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            settings_module_1.SettingsModule,
            catalog_module_1.CatalogModule,
            pricing_module_1.PricingModule,
            inventory_module_1.InventoryModule,
            sales_module_1.SalesModule,
            reports_module_1.ReportsModule,
            audit_module_1.AuditModule,
            health_module_1.HealthModule,
            cache_module_1.CacheModule,
            jobs_module_1.JobsModule,
            customers_module_1.CustomersModule,
            suppliers_module_1.SuppliersModule,
            purchases_module_1.PurchasesModule,
            cash_register_module_1.CashRegisterModule,
            accounting_module_1.AccountingModule,
            documents_module_1.DocumentsModule,
            hr_module_1.HrModule,
            banking_module_1.BankingModule,
            public_api_module_1.PublicApiModule,
            search_module_1.SearchModule,
            export_module_1.ExportModule,
            notifications_module_1.NotificationsModule,
            chat_module_1.ChatModule,
            tasks_module_1.TasksModule,
            permissions_module_1.PermissionsModule,
        ],
        providers: [
            { provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard },
            { provide: core_1.APP_GUARD, useClass: jwt_auth_guard_1.JwtAuthGuard },
            { provide: core_1.APP_GUARD, useClass: roles_guard_1.RolesGuard },
            module_registry_service_1.ModuleRegistryService,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map