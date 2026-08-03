import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { toPaginated } from '../../common/interfaces/paginated.interface';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

class QueryAuditDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  resourceType?: string;
}

@ApiTags('Auditoría')
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles('ADMIN', 'AUDITOR')
  @ApiOperation({
    summary: 'Listar registros de auditoría (solo ADMIN/AUDITOR)',
  })
  async findAll(@Query() query: QueryAuditDto) {
    const { items, total } = await this.auditService.findAll(query);
    return toPaginated(items, total, query.page, query.pageSize);
  }
}
