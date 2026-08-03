import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  AuthUser,
} from '../../common/decorators/current-user.decorator';

@ApiTags('Compras')
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  @Roles('ADMIN', 'INVENTORY_MANAGER')
  @HttpCode(201)
  @ApiOperation({
    summary: 'Registrar compra (actualiza stock, costos y Kardex)',
  })
  async create(
    @Body() dto: CreatePurchaseDto,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.purchasesService.create(dto, user, req);
  }

  @Get()
  @Roles('ADMIN', 'INVENTORY_MANAGER', 'MANAGER', 'AUDITOR')
  @ApiOperation({ summary: 'Listar compras (paginado)' })
  async findAll(@Query() query: PaginationDto & { q?: string }) {
    return this.purchasesService.findAll(query);
  }

  @Get(':id')
  @Roles('ADMIN', 'INVENTORY_MANAGER', 'MANAGER', 'AUDITOR')
  @ApiOperation({ summary: 'Detalle de compra con ítems' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.purchasesService.findOne(id);
  }
}
