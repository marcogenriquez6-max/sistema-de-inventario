"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const rxjs_1 = require("rxjs");
const notifications_service_1 = require("./notifications.service");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
let NotificationsController = class NotificationsController {
    constructor(notifications) {
        this.notifications = notifications;
    }
    async list(user, page, pageSize) {
        return this.notifications.list(user.id, Math.max(parseInt(page ?? '1', 10) || 1, 1), Math.min(Math.max(parseInt(pageSize ?? '20', 10) || 20, 1), 100));
    }
    async unreadCount(user) {
        return this.notifications.unreadCount(user.id);
    }
    stream(user) {
        return this.notifications.stream(user.id);
    }
    async markRead(user, id) {
        await this.notifications.markRead(user.id, id);
        return { ok: true };
    }
    async markAllRead(user) {
        await this.notifications.markAllRead(user.id);
        return { ok: true };
    }
    async test(user, message) {
        return this.notifications.create(user.id, 'TEST', 'Notificación de prueba', message ?? 'Esto es una prueba del centro de notificaciones en tiempo real.', { demo: true });
    }
};
exports.NotificationsController = NotificationsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar notificaciones del usuario (paginado)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('unread-count'),
    (0, swagger_1.ApiOperation)({ summary: 'Cantidad de notificaciones sin leer' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "unreadCount", null);
__decorate([
    (0, common_1.Sse)('stream'),
    (0, swagger_1.ApiOperation)({ summary: 'Stream SSE en tiempo real de notificaciones' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", rxjs_1.Observable)
], NotificationsController.prototype, "stream", null);
__decorate([
    (0, common_1.Patch)('read/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Marcar una notificación como leída' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "markRead", null);
__decorate([
    (0, common_1.Post)('read-all'),
    (0, swagger_1.ApiOperation)({ summary: 'Marcar todas como leídas' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "markAllRead", null);
__decorate([
    (0, common_1.Post)('test'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Crear una notificación de prueba (admin)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)('message')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "test", null);
exports.NotificationsController = NotificationsController = __decorate([
    (0, swagger_1.ApiTags)('Notificaciones'),
    (0, common_1.Controller)('notifications'),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService])
], NotificationsController);
//# sourceMappingURL=notifications.controller.js.map