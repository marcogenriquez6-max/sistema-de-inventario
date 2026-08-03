import {
  Body,
  Controller,
  Delete,
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
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  AuthUser,
} from '../../common/decorators/current-user.decorator';

@ApiTags('Documentos')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  @Roles('ADMIN', 'MANAGER', 'AUDITOR', 'INVENTORY_MANAGER')
  @ApiOperation({ summary: 'Listar/buscar documentos' })
  async findAll(
    @Query() query: PaginationDto & { q?: string; category?: string },
  ) {
    return this.documentsService.findAll(query);
  }

  @Get(':id')
  @Roles('ADMIN', 'MANAGER', 'AUDITOR', 'INVENTORY_MANAGER')
  @ApiOperation({ summary: 'Detalle de documento' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.documentsService.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'INVENTORY_MANAGER')
  @HttpCode(201)
  @ApiOperation({ summary: 'Registrar documento (metadatos)' })
  async create(
    @Body() dto: CreateDocumentDto,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.documentsService.create(dto, user, req);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(204)
  @ApiOperation({ summary: 'Eliminar registro de documento' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    await this.documentsService.remove(id, user, req);
  }
}
