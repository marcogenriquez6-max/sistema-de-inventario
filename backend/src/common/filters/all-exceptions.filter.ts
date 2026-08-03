import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainException } from '../domain-exceptions';

interface ErrorBody {
  statusCode: number;
  message: string;
  error: string;
  details?: Record<string, unknown>;
  path: string;
  timestamp: string;
  traceId?: string;
}

/**
 * Filtro global de excepciones. Unifica el formato de error del API:
 * { statusCode, message, error, details, path, timestamp }.
 * Registra en log estructurado cada error de servidor.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const traceId = request.headers['x-request-id']?.toString();
    const body: ErrorBody = {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR',
      path: request.url,
      timestamp: new Date().toISOString(),
      traceId,
    };

    if (exception instanceof DomainException) {
      body.statusCode = exception.code;
      body.message = exception.message;
      body.error = HttpStatus[exception.code] ?? 'DOMAIN_ERROR';
      body.details = exception.details;
    } else if (exception instanceof HttpException) {
      const res = exception.getResponse();
      body.statusCode = exception.getStatus();
      if (typeof res === 'string') {
        body.message = res;
      } else if (res && typeof res === 'object') {
        const r = res as Record<string, unknown>;
        body.message = Array.isArray(r.message)
          ? (r.message as string[]).join(', ')
          : String(r.message ?? exception.message);
        body.error = String(r.error ?? HttpStatus[body.statusCode]);
        body.details = { errors: r.message };
      }
    }

    if (body.statusCode >= 500) {
      this.logger.error(
        `[${traceId}] ${request.method} ${request.url} -> ${body.statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(
        `[${traceId}] ${request.method} ${request.url} -> ${body.statusCode} (${body.message})`,
      );
    }

    response.status(body.statusCode).json(body);
  }
}
