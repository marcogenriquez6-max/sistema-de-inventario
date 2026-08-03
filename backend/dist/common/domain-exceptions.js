"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForbiddenOperationException = exports.PreconditionFailedException = exports.NotFoundException = exports.ConflictException = exports.DomainException = void 0;
const common_1 = require("@nestjs/common");
class DomainException extends Error {
    constructor(code, message, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'DomainException';
    }
}
exports.DomainException = DomainException;
class ConflictException extends DomainException {
    constructor(message, details) {
        super(common_1.HttpStatus.CONFLICT, message, details);
    }
}
exports.ConflictException = ConflictException;
class NotFoundException extends DomainException {
    constructor(message, details) {
        super(common_1.HttpStatus.NOT_FOUND, message, details);
    }
}
exports.NotFoundException = NotFoundException;
class PreconditionFailedException extends DomainException {
    constructor(message, details) {
        super(common_1.HttpStatus.PRECONDITION_FAILED, message, details);
    }
}
exports.PreconditionFailedException = PreconditionFailedException;
class ForbiddenOperationException extends DomainException {
    constructor(message, details) {
        super(common_1.HttpStatus.FORBIDDEN, message, details);
    }
}
exports.ForbiddenOperationException = ForbiddenOperationException;
//# sourceMappingURL=domain-exceptions.js.map