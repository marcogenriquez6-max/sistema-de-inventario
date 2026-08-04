import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { SettingsService } from './settings.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { RequireModule } from '../../common/decorators/require-module.decorator';
import {
  CurrentUser,
  AuthUser,
} from '../../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';

@ApiTags('Configuración')
@RequireModule('settings')
@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Listar parámetros globales (solo ADMIN)' })
  async getAll() {
    return this.settingsService.getAll();
  }

  @Patch(':key')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Actualizar parámetro global (versión el cambio)' })
  async update(
    @Param('key') key: string,
    @Body() dto: UpdateSettingDto,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    const result = await this.settingsService.set(key, dto.value, user.id);
    await this.auditService.record({
      userId: user.id,
      action: 'SETTING:UPDATE',
      resourceType: 'settings',
      resourceId: key,
      metadata: { value: dto.value },
      request: req,
    });
    return result;
  }

  @Get('public/:key')
  @Public()
  @ApiOperation({ summary: 'Leer parámetro público (ej: tax_rate para POS)' })
  async getPublic(@Param('key') key: string) {
    const value = await this.settingsService.get<Record<string, unknown>>(key);
    if (value === null || value === undefined) {
      throw new NotFoundException(`Parámetro "${key}" no encontrado`);
    }
    return { key, value };
  }

  @Get('history/:key')
  @Roles('ADMIN', 'AUDITOR')
  @ApiOperation({ summary: 'Historial de cambios de un parámetro' })
  async history(@Param('key') key: string) {
    return this.settingsService.getHistory(key);
  }
}
