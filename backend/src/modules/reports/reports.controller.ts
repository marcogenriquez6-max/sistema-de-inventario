import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ReportsService } from './reports.service';
import { Roles } from '../../common/decorators/roles.decorator';

class RangeDto {
  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;
}

class LowStockDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}

@ApiTags('Reportes')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @Roles('ADMIN', 'MANAGER', 'AUDITOR', 'SELLER')
  @ApiOperation({ summary: 'Resumen para el dashboard' })
  async dashboard() {
    return this.reportsService.dashboard();
  }

  @Get('low-stock')
  @Roles('ADMIN', 'MANAGER', 'INVENTORY_MANAGER')
  @ApiOperation({ summary: 'Stock crítico (reposición)' })
  async lowStock(@Query() query: LowStockDto) {
    return this.reportsService.lowStock(query.page ?? 1, query.pageSize ?? 20);
  }

  @Get('sales-by-day')
  @Roles('ADMIN', 'MANAGER', 'AUDITOR')
  @ApiOperation({ summary: 'Ventas por día en un rango (gráficas)' })
  async salesByDay(@Query() query: RangeDto) {
    return this.reportsService.salesByDay(query.from ?? '', query.to ?? '');
  }
}
