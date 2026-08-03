import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseDocument } from './purchase-document.entity';
import { PurchaseItem } from './purchase-item.entity';
import { PurchasesService } from './purchases.service';
import { PurchasesController } from './purchases.controller';
import { PricingModule } from '../pricing/pricing.module';
import { SettingsModule } from '../settings/settings.module';
import { SuppliersModule } from '../suppliers/suppliers.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PurchaseDocument, PurchaseItem]),
    PricingModule,
    SettingsModule,
    SuppliersModule,
    AuditModule,
    NotificationsModule,
  ],
  controllers: [PurchasesController],
  providers: [PurchasesService],
  exports: [PurchasesService],
})
export class PurchasesModule {}
