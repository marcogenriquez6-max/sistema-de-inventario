import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { CatalogService } from './catalog.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireModule } from '../../common/decorators/require-module.decorator';
import {
  CurrentUser,
  AuthUser,
} from '../../common/decorators/current-user.decorator';

@ApiTags('Catálogo')
@RequireModule('catalog')
@Controller('products')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('by-code/:code')
  @ApiOperation({
    summary: 'Buscar por código exacto (SKU, OEM o código de barras)',
  })
  async findByCode(@Param('code') code: string) {
    return this.catalogService.findByCode(code);
  }

  @Get('facets')
  @ApiOperation({
    summary: 'Valores disponibles para filtros (marcas, categorías, procedencias)',
  })
  async facets() {
    return this.catalogService.getFacets();
  }

  @Get('import-template')
  @Roles('INVENTORY_MANAGER', 'ADMIN')
  @ApiOperation({
    summary: 'Descargar plantilla CSV para importar productos',
  })
  async importTemplate(@Res() res: Response) {
    const csv = this.catalogService.getImportTemplate();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="plantilla_productos.csv"',
    );
    res.end('\uFEFF' + csv);
  }

  @Post('import')
  @Roles('INVENTORY_MANAGER', 'ADMIN')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const ok = /\.(csv|xlsx)$/i.test(file.originalname);
        cb(ok ? null : new BadRequestException('Solo se admiten archivos CSV o XLSX'), ok);
      },
    }),
  )
  @ApiOperation({
    summary: 'Importar productos desde CSV/XLSX (crea o actualiza por SKU)',
  })
  async import(
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    if (!file) {
      throw new BadRequestException('No se recibió el archivo');
    }
    return this.catalogService.importProducts(
      file.buffer,
      file.originalname,
      user,
      req,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Listar/filtrar repuestos (paginado)' })
  async findAll(@Query() query: QueryProductDto) {
    return this.catalogService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ficha completa de un repuesto' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.catalogService.findOne(id);
  }

  @Post()
  @Roles('INVENTORY_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Crear repuesto (solo inventario/admin)' })
  async create(
    @Body() dto: CreateProductDto,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.catalogService.create(dto, user, req);
  }

  @Patch(':id')
  @Roles('INVENTORY_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Actualizar repuesto (solo inventario/admin)' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.catalogService.update(id, dto, user, req);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(204)
  @ApiOperation({ summary: 'Eliminar repuesto (solo admin)' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    await this.catalogService.remove(id, user, req);
  }
}
