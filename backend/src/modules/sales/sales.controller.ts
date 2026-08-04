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
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { QuerySaleDto } from './dto/query-sale.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireModule } from '../../common/decorators/require-module.decorator';
import {
  CurrentUser,
  AuthUser,
} from '../../common/decorators/current-user.decorator';
import { IsString, MaxLength } from 'class-validator';

class VoidSaleDto {
  @IsString()
  @MaxLength(200)
  reason: string;
}

@ApiTags('Ventas (POS)')
@RequireModule('sales')
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @Roles('SELLER', 'ADMIN', 'INVENTORY_MANAGER')
  @ApiOperation({
    summary: 'Ejecutar venta (nota o factura) con descuento atómico de stock',
  })
  @HttpCode(201)
  async create(
    @Body() dto: CreateSaleDto,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.salesService.createSale(dto, user, req);
  }

  @Get()
  @Roles('ADMIN', 'MANAGER', 'AUDITOR', 'SELLER')
  @ApiOperation({ summary: 'Listar documentos de venta (paginado + filtros)' })
  async findAll(@Query() query: QuerySaleDto) {
    return this.salesService.findAll(query);
  }

  @Get(':id')
  @Roles('ADMIN', 'MANAGER', 'AUDITOR', 'SELLER')
  @ApiOperation({ summary: 'Detalle de documento con ítems' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.salesService.findOne(id);
  }

  @Get(':id/pdf')
  @Roles('ADMIN', 'MANAGER', 'AUDITOR', 'SELLER')
  @ApiOperation({
    summary: 'Generar factura / nota de venta en PDF para el cliente',
  })
  async pdf(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const buffer = await this.salesService.pdfInvoice(id);
    const filename = `venta_${id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.end(buffer);
  }

  @Post(':id/void')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Anular documento (solo admin)' })
  async void(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: VoidSaleDto,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.salesService.voidDocument(id, dto.reason, user, req);
  }
}
