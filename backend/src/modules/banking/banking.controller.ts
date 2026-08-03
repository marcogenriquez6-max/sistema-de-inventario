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
import { BankingService } from './banking.service';
import {
  CreateBankAccountDto,
  BankMovementDto,
  TransferDto,
} from './dto/banking.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  AuthUser,
} from '../../common/decorators/current-user.decorator';

@ApiTags('Bancos y Tesorería')
@Controller('banking')
export class BankingController {
  constructor(private readonly bankingService: BankingService) {}

  @Get('accounts')
  @Roles('ADMIN', 'MANAGER', 'AUDITOR')
  @ApiOperation({ summary: 'Cuentas bancarias' })
  async accounts() {
    return this.bankingService.listAccounts();
  }

  @Post('accounts')
  @Roles('ADMIN')
  @HttpCode(201)
  @ApiOperation({ summary: 'Crear cuenta bancaria' })
  async createAccount(
    @Body() dto: CreateBankAccountDto,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.bankingService.createAccount(dto, user, req);
  }

  @Post('accounts/:id/movements')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Depósito o retiro en cuenta' })
  async addMovement(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: BankMovementDto,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.bankingService.addMovement(id, dto, user, req);
  }

  @Post('accounts/:id/transfer')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Transferencia entre cuentas' })
  async transfer(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: TransferDto,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    await this.bankingService.transfer(id, dto, user, req);
    return { ok: true };
  }

  @Get('accounts/:id/movements')
  @Roles('ADMIN', 'MANAGER', 'AUDITOR')
  @ApiOperation({ summary: 'Movimientos de una cuenta' })
  async movements(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: PaginationDto,
  ) {
    return this.bankingService.movements(id, query.page, query.pageSize);
  }
}
