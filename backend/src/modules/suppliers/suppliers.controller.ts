import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireModule } from '../../common/decorators/require-module.decorator';
import {
  CurrentUser,
  AuthUser,
} from '../../common/decorators/current-user.decorator';

@ApiTags('Proveedores')
@RequireModule('suppliers')
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @Roles('ADMIN', 'INVENTORY_MANAGER', 'MANAGER')
  @ApiOperation({ summary: 'Listar/buscar proveedores (paginado)' })
  async findAll(@Query() query: PaginationDto & { q?: string }) {
    return this.suppliersService.findAll(query);
  }

  @Get(':id')
  @Roles('ADMIN', 'INVENTORY_MANAGER', 'MANAGER')
  @ApiOperation({ summary: 'Detalle de proveedor' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.suppliersService.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'INVENTORY_MANAGER')
  @ApiOperation({ summary: 'Crear proveedor' })
  async create(
    @Body() dto: CreateSupplierDto,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.suppliersService.create(dto, user, req);
  }

  @Patch(':id')
  @Roles('ADMIN', 'INVENTORY_MANAGER')
  @ApiOperation({ summary: 'Actualizar proveedor' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSupplierDto,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.suppliersService.update(id, dto, user, req);
  }
}
