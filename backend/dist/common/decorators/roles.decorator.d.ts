export type Role = 'ADMIN' | 'SELLER' | 'INVENTORY_MANAGER' | 'MANAGER' | 'AUDITOR';
export declare const ROLES_KEY = "roles";
export declare const Roles: (...roles: Role[]) => import("@nestjs/common").CustomDecorator<string>;
