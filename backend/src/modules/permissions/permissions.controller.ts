import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  AuthUser,
} from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/decorators/roles.decorator';
import {
  PermissionsService,
  PERMISSION_MODULES,
  ROLES,
  PermissionMatrix,
} from './permissions.service';

@ApiTags('permissions')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissions: PermissionsService) {}

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Matriz de permisos completa (solo ADMIN)' })
  async getAll(): Promise<{
    roles: string[];
    modules: string[];
    matrix: PermissionMatrix;
  }> {
    const matrix = await this.permissions.getMatrix();
    return { roles: [...ROLES], modules: [...PERMISSION_MODULES], matrix };
  }

  @Get('matrix')
  @ApiOperation({
    summary: 'Permisos del usuario autenticado para la navegación',
  })
  async getMine(@CurrentUser() user: AuthUser): Promise<{
    modules: string[];
    matrix: Record<string, boolean>;
  }> {
    const matrix = await this.permissions.getMatrixForRole(user.role as Role);
    return { modules: [...PERMISSION_MODULES], matrix };
  }

  @Patch()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Actualiza la matriz de permisos (solo ADMIN)' })
  async update(
    @CurrentUser() user: AuthUser,
    @Body() body: { matrix: PermissionMatrix },
  ): Promise<{ matrix: PermissionMatrix }> {
    const matrix = await this.permissions.setMatrix(body.matrix, user.id);
    return { matrix };
  }

  @Post('reset')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Restaura la matriz de permisos por defecto (solo ADMIN)',
  })
  async reset(
    @CurrentUser() user: AuthUser,
  ): Promise<{ matrix: PermissionMatrix }> {
    const matrix = await this.permissions.resetMatrix(user.id);
    return { matrix };
  }
}
