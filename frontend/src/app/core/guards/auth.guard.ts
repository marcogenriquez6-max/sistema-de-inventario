import { Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { PermissionsService } from '../services/permissions.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) return true;
  return router.createUrlTree(['/login']);
};

export function roleGuard(...roles: string[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const r = auth.role();
    if (r && roles.includes(r)) return true;
    return router.createUrlTree(['/dashboard']);
  };
}

export function permissionGuard(module: string): CanActivateFn {
  return async () => {
    const perms = inject(PermissionsService);
    const router = inject(Router);
    await perms.ensureLoaded();
    if (perms.can(module)) return true;
    return router.createUrlTree(['/dashboard']);
  };
}
