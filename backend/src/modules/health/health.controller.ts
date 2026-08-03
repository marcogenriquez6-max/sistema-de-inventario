import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Public } from '../../common/decorators/public.decorator';
import { ModuleRegistryService } from '../../common/services/module-registry.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly moduleRegistry: ModuleRegistryService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Liveness: el API responde' })
  liveness() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('db')
  @ApiOperation({ summary: 'Readiness: verifica conexión con PostgreSQL' })
  async readiness() {
    await this.dataSource.query('SELECT 1');
    return {
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('modules')
  @ApiOperation({ summary: 'Estado de módulos del ERP' })
  async modules() {
    return {
      enabledCount: this.moduleRegistry.getEnabledCount(),
      totalCount: this.moduleRegistry.getModules().length,
      modules: this.moduleRegistry.getModules(),
      timestamp: new Date().toISOString(),
    };
  }
}
