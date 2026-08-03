import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

/**
 * Interceptor de logging por request. Registra método, ruta, status y duración.
 * Usa el traceId (x-request-id) para correlacionar logs.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const traceId = request.headers['x-request-id'] ?? '-';
    const started = Date.now();
    const { method, url } = request;

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context
            .switchToHttp()
            .getResponse<{ statusCode: number }>();
          this.logger.log(
            `[${traceId}] ${method} ${url} ${response.statusCode} ${Date.now() - started}ms`,
          );
        },
        error: (err: { status?: number }) => {
          this.logger.error(
            `[${traceId}] ${method} ${url} ${err.status ?? 500} ${Date.now() - started}ms`,
          );
        },
      }),
    );
  }
}
