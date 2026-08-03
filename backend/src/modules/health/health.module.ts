import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { ModuleRegistryService } from '../../common/services/module-registry.service';

@Module({
  imports: [ConfigModule],
  controllers: [HealthController],
  providers: [ModuleRegistryService],
})
export class HealthModule {}
