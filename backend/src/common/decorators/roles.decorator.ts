import { SetMetadata } from '@nestjs/common';

export type Role =
  'ADMIN' | 'SELLER' | 'INVENTORY_MANAGER' | 'MANAGER' | 'AUDITOR';

export const ROLES_KEY = 'roles';

/** Define los roles permitidos en un endpoint. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
