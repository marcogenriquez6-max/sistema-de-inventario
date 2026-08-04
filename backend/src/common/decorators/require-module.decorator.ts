import { SetMetadata } from '@nestjs/common';

export const MODULE_KEY = 'require_module';

/**
 * Declara el módulo de negocio al que pertenece un controlador/endpoint.
 * El PermissionsGuard valida contra la matriz de permisos por rol.
 */
export const RequireModule = (module: string) =>
  SetMetadata(MODULE_KEY, module);
