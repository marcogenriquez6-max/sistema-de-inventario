"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AllExceptionsFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
const domain_exceptions_1 = require("../domain-exceptions");
let AllExceptionsFilter = AllExceptionsFilter_1 = class AllExceptionsFilter {
    constructor() {
        this.logger = new common_1.Logger(AllExceptionsFilter_1.name);
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const traceId = request.headers['x-request-id']?.toString();
        const body = {
            statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'Error interno del servidor',
            error: 'INTERNAL_SERVER_ERROR',
            path: request.url,
            timestamp: new Date().toISOString(),
            traceId,
        };
        if (exception instanceof domain_exceptions_1.DomainException) {
            body.statusCode = exception.code;
            body.message = exception.message;
            body.error = common_1.HttpStatus[exception.code] ?? 'DOMAIN_ERROR';
            body.details = exception.details;
        }
        else if (exception instanceof common_1.HttpException) {
            const res = exception.getResponse();
            body.statusCode = exception.getStatus();
            if (typeof res === 'string') {
                body.message = res;
            }
            else if (res && typeof res === 'object') {
                const r = res;
                body.message = Array.isArray(r.message)
                    ? r.message.join(', ')
                    : String(r.message ?? exception.message);
                body.error = String(r.error ?? common_1.HttpStatus[body.statusCode]);
                body.details = { errors: r.message };
            }
        }
        if (body.statusCode >= 500) {
            this.logger.error(`[${traceId}] ${request.method} ${request.url} -> ${body.statusCode}`, exception instanceof Error ? exception.stack : String(exception));
        }
        else {
            this.logger.warn(`[${traceId}] ${request.method} ${request.url} -> ${body.statusCode} (${body.message})`);
        }
        response.status(body.statusCode).json(body);
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = AllExceptionsFilter_1 = __decorate([
    (0, common_1.Catch)()
], AllExceptionsFilter);
//# sourceMappingURL=all-exceptions.filter.js.map