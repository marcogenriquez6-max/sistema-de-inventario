import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SaleDocument } from './sale-document.entity';
import { SaleItem } from './sale-item.entity';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { PricingModule } from '../pricing/pricing.module';
import { SettingsModule } from '../settings/settings.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SaleDocument, SaleItem]),
    PricingModule,
    SettingsModule,
    AuditModule,
    NotificationsModule,
  ],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
