import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { envValidationSchema } from './config/env.validation';
import { typeOrmConfig } from './config/database.config';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SettingsModule } from './modules/settings/settings.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { SalesModule } from './modules/sales/sales.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AuditModule } from './modules/audit/audit.module';
import { HealthModule } from './modules/health/health.module';
import { CacheModule } from './common/services/cache/cache.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { CustomersModule } from './modules/customers/customers.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { PurchasesModule } from './modules/purchases/purchases.module';
import { CashRegisterModule } from './modules/cash-register/cash-register.module';
import { AccountingModule } from './modules/accounting/accounting.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { HrModule } from './modules/hr/hr.module';
import { BankingModule } from './modules/banking/banking.module';
import { PublicApiModule } from './modules/public-api/public-api.module';
import { SearchModule } from './modules/search/search.module';
import { ExportModule } from './modules/export/export.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ChatModule } from './modules/chat/chat.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { ModuleRegistryService } from './common/services/module-registry.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      envFilePath: ['.env', '.env.local'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: typeOrmConfig,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('THROTTLE_TTL', 60) * 1000,
            limit: config.get<number>('THROTTLE_LIMIT', 100),
          },
        ],
      }),
    }),
    AuthModule,
    UsersModule,
    SettingsModule,
    CatalogModule,
    PricingModule,
    InventoryModule,
    SalesModule,
    ReportsModule,
    AuditModule,
    HealthModule,
    CacheModule,
    JobsModule,
    CustomersModule,
    SuppliersModule,
    PurchasesModule,
    CashRegisterModule,
    AccountingModule,
    DocumentsModule,
    HrModule,
    BankingModule,
    PublicApiModule,
    SearchModule,
    ExportModule,
    NotificationsModule,
    ChatModule,
    TasksModule,
    PermissionsModule,
    UploadsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    ModuleRegistryService,
  ],
})
export class AppModule {}
