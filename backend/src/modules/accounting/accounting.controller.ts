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
import { AccountingService } from './accounting.service';
import { CreateAccountDto, CreateJournalEntryDto } from './dto/accounting.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  AuthUser,
} from '../../common/decorators/current-user.decorator';

@ApiTags('Contabilidad')
@Controller('accounting')
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Get('accounts')
  @Roles('ADMIN', 'MANAGER', 'AUDITOR')
  @ApiOperation({ summary: 'Plan de cuentas' })
  async accounts() {
    return this.accountingService.listAccounts();
  }

  @Post('accounts')
  @Roles('ADMIN')
  @HttpCode(201)
  @ApiOperation({ summary: 'Crear cuenta contable' })
  async createAccount(
    @Body() dto: CreateAccountDto,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.accountingService.createAccount(dto, user, req);
  }

  @Post('entries')
  @Roles('ADMIN', 'MANAGER')
  @HttpCode(201)
  @ApiOperation({ summary: 'Registrar asiento de diario (debe cuadrar)' })
  async createEntry(
    @Body() dto: CreateJournalEntryDto,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.accountingService.createEntry(dto, user, req);
  }

  @Get('entries')
  @Roles('ADMIN', 'MANAGER', 'AUDITOR')
  @ApiOperation({ summary: 'Listar asientos (paginado)' })
  async listEntries(@Query() query: PaginationDto) {
    return this.accountingService.listEntries(query.page, query.pageSize);
  }

  @Get('entries/:id')
  @Roles('ADMIN', 'MANAGER', 'AUDITOR')
  @ApiOperation({ summary: 'Detalle de asiento con líneas' })
  async entry(@Param('id', ParseIntPipe) id: number) {
    return this.accountingService.findOne(id);
  }

  @Get('trial-balance')
  @Roles('ADMIN', 'MANAGER', 'AUDITOR')
  @ApiOperation({ summary: 'Balance de comprobación por cuenta' })
  async trialBalance() {
    return this.accountingService.trialBalance();
  }
}
