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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const rxjs_1 = require("rxjs");
const notification_entity_1 = require("./notification.entity");
let NotificationsService = class NotificationsService {
    constructor(repo, dataSource) {
        this.repo = repo;
        this.dataSource = dataSource;
        this.bus = new rxjs_1.Subject();
    }
    async create(userId, type, title, message, data) {
        const n = this.repo.create({
            userId,
            type,
            title,
            message: message ?? null,
            data: data ?? null,
        });
        const saved = await this.repo.save(n);
        this.bus.next({ userId, notification: saved });
        return saved;
    }
    async createForRoles(roles, type, title, message, data) {
        if (roles.length === 0)
            return;
        const rows = await this.dataSource.query(`SELECT id FROM users WHERE is_active = TRUE AND role = ANY($1)`, [roles]);
        for (const r of rows) {
            await this.create(r.id, type, title, message, data);
        }
    }
    async list(userId, page = 1, pageSize = 20) {
        const [items, total] = await this.repo.findAndCount({
            where: { userId },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });
        const unread = await this.repo.count({ where: { userId, isRead: false } });
        return { items, total, unread };
    }
    async markRead(userId, id) {
        await this.repo.update({ userId, id }, { isRead: true });
    }
    async markAllRead(userId) {
        await this.repo.update({ userId, isRead: false }, { isRead: true });
    }
    async unreadCount(userId) {
        return this.repo.count({ where: { userId, isRead: false } });
    }
    stream(userId) {
        return this.bus.pipe((0, rxjs_1.filter)((e) => e.userId === userId), (0, rxjs_1.map)(({ notification }) => ({ data: notification })));
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(notification_entity_1.Notification)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.DataSource])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map