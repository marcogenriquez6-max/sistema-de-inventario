import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, Role } from '../decorators/roles.decorator';

/**
 * Guard de autorización por roles (RBAC). Compara el rol del usuario autenticado
 * contra los roles permitidos declarados con @Roles(...).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const { user } = context
      .switchToHttp()
      .getRequest<{ user?: { role: string } }>();
    if (!user) {
      throw new ForbiddenException('Sesión no válida');
    }
    if (!requiredRoles.includes(user.role as Role)) {
      throw new ForbiddenException('No tienes permiso para esta operación');
    }
    return true;
  }
}
