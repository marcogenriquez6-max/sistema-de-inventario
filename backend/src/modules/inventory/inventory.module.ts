import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockMovement } from './stock-movement.entity';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { PricingModule } from '../pricing/pricing.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StockMovement]),
    PricingModule,
    AuditModule,
    NotificationsModule,
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
