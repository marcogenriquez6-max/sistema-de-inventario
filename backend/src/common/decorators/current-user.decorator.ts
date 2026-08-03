import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: string;
}

/**
 * Extrae el usuario autenticado (inyectado por JwtStrategy) del request.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: AuthUser }>();
    return request.user;
  },
);
