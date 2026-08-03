import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../catalog/product.entity';
import { PublicApiController } from './public-api.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  controllers: [PublicApiController],
})
export class PublicApiModule {}
