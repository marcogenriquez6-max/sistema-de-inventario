import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { ApiError } from '../models';

function messageOf(err: HttpErrorResponse): string {
  const body = err.error as ApiError | undefined;
  if (body && body.message) {
    if (Array.isArray(body.message)) return body.message.join('. ');
    return body.message;
  }
  if (err.status === 0) return 'No se pudo conectar con el servidor';
  if (err.status === 401) return 'Sesión expirada o credenciales inválidas';
  if (err.status === 403) return 'No tiene permisos para esta acción';
  if (err.status >= 500) return 'Error interno del servidor';
  return 'Error inesperado';
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && req.url.includes('/auth/login')) {
        toast.error(messageOf(err));
      } else if (err.status >= 400) {
        toast.error(messageOf(err));
      }
      return throwError(() => err);
    }),
  );
};
