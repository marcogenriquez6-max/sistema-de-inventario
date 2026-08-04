import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, Role } from '../decorators/roles.decorator';
import { MODULE_KEY } from '../decorators/require-module.decorator';
import { PermissionsService } from '../../modules/permissions/permissions.service';

/**
 * Guard de autorización por roles (RBAC) + permisos por módulo.
 *
 * - `@Roles(...)`: verifica que el rol del usuario esté en la lista (por endpoint).
 * - `@RequireModule('x')`: verifica contra la matriz de permisos guardada en DB
 *   que el rol del usuario tenga acceso al módulo (por controlador).
 *
 * Cuando solo se declara `@RequireModule`, ADMIN siempre pasa (evita bloqueos).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissions: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requiredModule = this.reflector.getAllAndOverride<string>(
      MODULE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if ((!requiredRoles || requiredRoles.length === 0) && !requiredModule) {
      return true;
    }

    const { user } = context
      .switchToHttp()
      .getRequest<{ user?: { role: string } }>();
    if (!user) {
      throw new ForbiddenException('Sesión no válida');
    }

    if (requiredRoles?.length && !requiredRoles.includes(user.role as Role)) {
      throw new ForbiddenException('No tienes permiso para esta operación');
    }

    if (requiredModule) {
      const allowed = await this.permissions.can(
        user.role as Role,
        requiredModule,
      );
      if (!allowed) {
        throw new ForbiddenException(
          `No tienes acceso al módulo "${requiredModule}"`,
        );
      }
    }

    return true;
  }
}
