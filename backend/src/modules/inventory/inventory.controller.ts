import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { InventoryService } from './inventory.service';
import { StockEntryDto } from './dto/stock-entry.dto';
import { AdjustmentDto } from './dto/adjustment.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireModule } from '../../common/decorators/require-module.decorator';
import {
  CurrentUser,
  AuthUser,
} from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Inventario')
@RequireModule('inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('purchases')
  @Roles('INVENTORY_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Registrar entrada de stock por compra' })
  async purchase(
    @Body() dto: StockEntryDto,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.inventoryService.registerPurchase(dto, user, req);
  }

  @Post('adjustments')
  @Roles('INVENTORY_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Registrar ajuste/merma/devolución justificada' })
  async adjust(
    @Body() dto: AdjustmentDto,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.inventoryService.registerAdjustment(dto, user, req);
  }

  @Get('kardex/:productId')
  @Roles('ADMIN', 'INVENTORY_MANAGER', 'MANAGER', 'AUDITOR')
  @ApiOperation({ summary: 'Kardex (trazabilidad) de un repuesto' })
  async kardex(
    @Param('productId', ParseIntPipe) productId: number,
    @Query() query: PaginationDto,
  ) {
    return this.inventoryService.getKardex(
      productId,
      query.page,
      query.pageSize,
    );
  }
}
