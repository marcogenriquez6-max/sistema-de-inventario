import {
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
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
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
