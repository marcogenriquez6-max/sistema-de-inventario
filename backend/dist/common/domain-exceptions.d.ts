import { HttpStatus } from '@nestjs/common';
export declare class DomainException extends Error {
    readonly code: HttpStatus;
    readonly details?: Record<string, unknown> | undefined;
    constructor(code: HttpStatus, message: string, details?: Record<string, unknown> | undefined);
}
export declare class ConflictException extends DomainException {
    constructor(message: string, details?: Record<string, unknown>);
}
export declare class NotFoundException extends DomainException {
    constructor(message: string, details?: Record<string, unknown>);
}
export declare class PreconditionFailedException extends DomainException {
    constructor(message: string, details?: Record<string, unknown>);
}
export declare class ForbiddenOperationException extends DomainException {
    constructor(message: string, details?: Record<string, unknown>);
}
