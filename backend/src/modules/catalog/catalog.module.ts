import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { ProductCode } from './product-code.entity';
import { ProductCompat } from './product-compat.entity';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';
import { PricingModule } from '../pricing/pricing.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductCode, ProductCompat]),
    PricingModule,
    AuditModule,
  ],
  controllers: [CatalogController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
