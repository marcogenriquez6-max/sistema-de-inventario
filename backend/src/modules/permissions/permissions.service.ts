import { ForbiddenException, Injectable } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';
import { Role } from '../../common/decorators/roles.decorator';

export const PERMISSIONS_SETTING_KEY = 'role_permissions';

export const ROLES: Role[] = [
  'ADMIN',
  'SELLER',
  'INVENTORY_MANAGER',
  'MANAGER',
  'AUDITOR',
];

export const PERMISSION_MODULES = [
  'dashboard',
  'pos',
  'catalog',
  'inventory',
  'sales',
  'customers',
  'suppliers',
  'purchases',
  'cash_register',
  'accounting',
  'banking',
  'hr',
  'documents',
  'tasks',
  'audit',
  'reports',
  'users',
  'settings',
  'permissions',
  'export',
  'notifications',
  'chat',
  'search',
] as const;

export type PermissionModule = (typeof PERMISSION_MODULES)[number];

export type PermissionMatrix = Record<Role, Record<string, boolean>>;

const ALL_MODULES_TRUE = (): Record<string, boolean> =>
  Object.fromEntries(PERMISSION_MODULES.map((m) => [m, true]));

const modulesFor = (
  role: Role,
  allowed: PermissionModule[],
): Record<string, boolean> => {
  const all = ALL_MODULES_TRUE();
  for (const m of PERMISSION_MODULES) {
    all[m] = role === 'ADMIN' || allowed.includes(m);
  }
  return all;
};

/** Matriz por defecto: replica el acceso actual de cada rol por módulo. */
export function defaultPermissionMatrix(): PermissionMatrix {
  return {
    ADMIN: ALL_MODULES_TRUE(),
    SELLER: modulesFor('SELLER', [
      'dashboard',
      'pos',
      'catalog',
      'sales',
      'customers',
      'tasks',
      'reports',
      'cash_register',
      'notifications',
      'chat',
      'search',
      'export',
    ]),
    INVENTORY_MANAGER: modulesFor('INVENTORY_MANAGER', [
      'dashboard',
      'catalog',
      'inventory',
      'sales',
      'customers',
      'suppliers',
      'purchases',
      'documents',
      'tasks',
      'reports',
      'cash_register',
      'notifications',
      'chat',
      'search',
      'export',
    ]),
    MANAGER: modulesFor('MANAGER', [
      'dashboard',
      'pos',
      'catalog',
      'inventory',
      'sales',
      'customers',
      'suppliers',
      'purchases',
      'cash_register',
      'accounting',
      'banking',
      'hr',
      'documents',
      'tasks',
      'reports',
      'notifications',
      'chat',
      'search',
      'export',
    ]),
    AUDITOR: modulesFor('AUDITOR', [
      'dashboard',
      'catalog',
      'customers',
      'documents',
      'tasks',
      'audit',
      'reports',
      'inventory',
      'purchases',
      'cash_register',
      'accounting',
      'banking',
      'notifications',
      'chat',
      'search',
      'export',
    ]),
  };
}

/**
 * Servicio de permisos por rol basado en la matriz `role_permissions`
 * guardada como ajuste (jsonb) con cache en memoria.
 */
@Injectable()
export class PermissionsService {
  private cachedMatrix: PermissionMatrix | null = null;

  constructor(private readonly settings: SettingsService) {}

  /** Devuelve la matriz completa, sembrando los valores por defecto si falta. */
  async getMatrix(): Promise<PermissionMatrix> {
    if (this.cachedMatrix) return this.cachedMatrix;
    const stored = await this.settings.get<PermissionMatrix>(
      PERMISSIONS_SETTING_KEY,
    );
    if (!stored) {
      const matrix = defaultPermissionMatrix();
      await this.settings.set(
        PERMISSIONS_SETTING_KEY,
        matrix as unknown as Record<string, unknown>,
        null,
      );
      this.cachedMatrix = matrix;
      return matrix;
    }
    this.cachedMatrix = stored;
    return stored;
  }

  /** Matriz para un rol concreto (siempre ADMIN=all). */
  async getMatrixForRole(role: Role): Promise<Record<string, boolean>> {
    const matrix = await this.getMatrix();
    if (role === 'ADMIN') return ALL_MODULES_TRUE();
    return matrix[role] ?? {};
  }

  /** ¿Puede el rol acceder al módulo? */
  async can(role: Role, module: string): Promise<boolean> {
    if (role === 'ADMIN') return true;
    const row = await this.getMatrixForRole(role);
    return row[module] === true;
  }

  /** Reemplaza la matriz (validando claves) y refresca la cache. */
  async setMatrix(
    matrix: PermissionMatrix,
    userId: number,
  ): Promise<PermissionMatrix> {
    this.assertMatrix(matrix);
    const normalized: PermissionMatrix = defaultPermissionMatrix();
    for (const role of ROLES) {
      if (role === 'ADMIN') continue;
      normalized[role] = {};
      for (const module of PERMISSION_MODULES) {
        normalized[role][module] = matrix[role]?.[module] === true;
      }
    }
    await this.settings.set(
      PERMISSIONS_SETTING_KEY,
      normalized as unknown as Record<string, unknown>,
      userId,
    );
    this.cachedMatrix = normalized;
    return normalized;
  }

  /** Restaura la matriz por defecto. */
  async resetMatrix(userId: number): Promise<PermissionMatrix> {
    const matrix = defaultPermissionMatrix();
    await this.settings.set(
      PERMISSIONS_SETTING_KEY,
      matrix as unknown as Record<string, unknown>,
      userId,
    );
    this.cachedMatrix = matrix;
    return matrix;
  }

  private assertMatrix(matrix: PermissionMatrix): void {
    if (!matrix || typeof matrix !== 'object') {
      throw new ForbiddenException('Matriz de permisos inválida');
    }
    for (const role of ROLES) {
      if (role === 'ADMIN') continue;
      const row = matrix[role];
      if (!row || typeof row !== 'object') {
        throw new ForbiddenException(`Fila inválida para el rol ${role}`);
      }
      for (const module of PERMISSION_MODULES) {
        if (row[module] !== undefined && typeof row[module] !== 'boolean') {
          throw new ForbiddenException(
            `Permiso inválido para ${role}/${module}`,
          );
        }
      }
    }
  }
}
