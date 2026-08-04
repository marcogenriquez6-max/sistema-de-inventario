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
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireModule } from '../../common/decorators/require-module.decorator';
import {
  CurrentUser,
  AuthUser,
} from '../../common/decorators/current-user.decorator';

@ApiTags('Clientes')
@RequireModule('customers')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @Roles('ADMIN', 'SELLER', 'MANAGER', 'INVENTORY_MANAGER')
  @ApiOperation({ summary: 'Listar/buscar clientes (paginado)' })
  async findAll(@Query() query: QueryCustomerDto) {
    return this.customersService.findAll(query);
  }

  @Get(':id')
  @Roles('ADMIN', 'SELLER', 'MANAGER')
  @ApiOperation({ summary: 'Detalle de cliente' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.customersService.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'SELLER')
  @ApiOperation({ summary: 'Crear cliente' })
  async create(
    @Body() dto: CreateCustomerDto,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.customersService.create(dto, user, req);
  }

  @Patch(':id')
  @Roles('ADMIN', 'SELLER')
  @ApiOperation({ summary: 'Actualizar cliente' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCustomerDto,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.customersService.update(id, dto, user, req);
  }
}
