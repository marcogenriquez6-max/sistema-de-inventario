import { HttpStatus } from '@nestjs/common';

/**
 * Excepción base de dominio. Permite transportar errores de reglas de negocio
 * desde la capa de aplicación hasta el filtro global, conservando un código
 * HTTP y un mensaje estable para el cliente.
 */
export class DomainException extends Error {
  constructor(
    public readonly code: HttpStatus,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'DomainException';
  }
}

/** Conflicto de estado (ej: stock insuficiente). */
export class ConflictException extends DomainException {
  constructor(message: string, details?: Record<string, unknown>) {
    super(HttpStatus.CONFLICT, message, details);
  }
}

/** Recurso no encontrado. */
export class NotFoundException extends DomainException {
  constructor(message: string, details?: Record<string, unknown>) {
    super(HttpStatus.NOT_FOUND, message, details);
  }
}

/** Operación no permitida por el estado actual. */
export class PreconditionFailedException extends DomainException {
  constructor(message: string, details?: Record<string, unknown>) {
    super(HttpStatus.PRECONDITION_FAILED, message, details);
  }
}

/** Acceso no autorizado para el rol actual. */
export class ForbiddenOperationException extends DomainException {
  constructor(message: string, details?: Record<string, unknown>) {
    super(HttpStatus.FORBIDDEN, message, details);
  }
}
