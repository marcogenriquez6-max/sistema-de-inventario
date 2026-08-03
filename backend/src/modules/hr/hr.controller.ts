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
import { HrService } from './hr.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  AuthUser,
} from '../../common/decorators/current-user.decorator';

@ApiTags('RR.HH.')
@Controller('employees')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Get()
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Listar/buscar empleados' })
  async findAll(
    @Query() query: PaginationDto & { q?: string; department?: string },
  ) {
    return this.hrService.findAll(query);
  }

  @Get(':id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Detalle de empleado' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.hrService.findOne(id);
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Crear empleado' })
  async create(
    @Body() dto: CreateEmployeeDto,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.hrService.create(dto, user, req);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Actualizar empleado' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmployeeDto,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.hrService.update(id, dto, user, req);
  }
}
