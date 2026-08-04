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
import { CashRegisterService } from './cash-register.service';
import {
  OpenRegisterDto,
  CashMovementDto,
  CloseRegisterDto,
} from './dto/cash-register.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireModule } from '../../common/decorators/require-module.decorator';
import {
  CurrentUser,
  AuthUser,
} from '../../common/decorators/current-user.decorator';

@ApiTags('Caja')
@RequireModule('cash_register')
@Controller('cash-registers')
export class CashRegisterController {
  constructor(private readonly cashRegisterService: CashRegisterService) {}

  @Post()
  @Roles('ADMIN', 'SELLER')
  @HttpCode(201)
  @ApiOperation({ summary: 'Abrir caja' })
  async open(
    @Body() dto: OpenRegisterDto,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.cashRegisterService.openRegister(dto, user, req);
  }

  @Get('mine')
  @Roles('ADMIN', 'SELLER')
  @ApiOperation({ summary: 'Mi caja abierta actual' })
  async mine(@CurrentUser() user: AuthUser) {
    return this.cashRegisterService.getOpenRegister(user.id);
  }

  @Post(':id/movements')
  @Roles('ADMIN', 'SELLER')
  @ApiOperation({ summary: 'Registrar movimiento de caja' })
  async addMovement(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CashMovementDto,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.cashRegisterService.addMovement(id, dto, user, req);
  }

  @Get(':id/movements')
  @Roles('ADMIN', 'SELLER', 'MANAGER', 'AUDITOR')
  @ApiOperation({ summary: 'Movimientos de una caja' })
  async movements(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: PaginationDto,
  ) {
    return this.cashRegisterService.getMovements(
      id,
      query.page,
      query.pageSize,
    );
  }

  @Post(':id/close')
  @Roles('ADMIN', 'SELLER')
  @ApiOperation({ summary: 'Cerrar caja con arqueo (conteo físico)' })
  async close(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CloseRegisterDto,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.cashRegisterService.closeRegister(id, dto, user, req);
  }
}
