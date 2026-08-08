import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ExportService, ExportFormat } from './export.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireModule } from '../../common/decorators/require-module.decorator';

@ApiTags('Exportación')
@RequireModule('export')
@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('formats')
  @ApiOperation({ summary: 'Listar recursos y formatos de exportación' })
  formats() {
    return {
      formats: this.exportService.getFormats(),
      resources: this.exportService.getResourceNames(),
    };
  }

  @Get(':resource')
  @Roles('ADMIN', 'MANAGER', 'AUDITOR', 'SELLER', 'INVENTORY_MANAGER')
  @ApiOperation({ summary: 'Exportar datos en CSV, XLSX o PDF' })
  @ApiParam({
    name: 'resource',
    example: 'products',
    description: 'Recurso a exportar',
  })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ['csv', 'xlsx', 'pdf'],
    description: 'Formato (default: csv)',
  })
  @ApiQuery({ name: 'q', required: false, description: 'Filtro de texto' })
  @ApiQuery({ name: 'brand', required: false, description: 'Filtro de marca' })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filtro de categoría',
  })
  @ApiQuery({
    name: 'provenance',
    required: false,
    description: 'Filtro de procedencia',
  })
  @ApiQuery({
    name: 'lowStock',
    required: false,
    description: '1 = solo stock bajo mínimo',
  })
  @ApiQuery({
    name: 'from',
    required: false,
    description: 'Fecha inicial (ISO)',
  })
  @ApiQuery({ name: 'to', required: false, description: 'Fecha final (ISO)' })
  async export(
    @Param('resource') resource: string,
    @Query('format') format: ExportFormat | undefined,
    @Query('q') q: string | undefined,
    @Query('brand') brand: string | undefined,
    @Query('category') category: string | undefined,
    @Query('provenance') provenance: string | undefined,
    @Query('lowStock') lowStock: number | undefined,
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Res() res: Response,
  ) {
    const { buffer, mime, extension } = await this.exportService.export(
      resource,
      format ?? 'csv',
      {
        q,
        brand,
        category,
        provenance,
        lowStock,
        from,
        to,
      },
    );
    const name = `repuestos_${resource}_${new Date().toISOString().replace(/[:.]/g, '-')}.${extension}`;
    res.setHeader('Content-Type', mime);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${name}"; filename*=UTF-8''${encodeURIComponent(name)}`,
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.end(buffer);
  }
}
