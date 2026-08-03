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
var NotificationsProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsProcessor = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bullmq_1 = require("bullmq");
const ioredis_1 = require("ioredis");
let NotificationsProcessor = NotificationsProcessor_1 = class NotificationsProcessor {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(NotificationsProcessor_1.name);
        this.worker = null;
        this.connection = null;
    }
    async onModuleInit() {
        const url = this.configService.get('REDIS_URL');
        if (!url) {
            this.logger.log('NotificationsProcessor deshabilitado (sin Redis)');
            return;
        }
        this.connection = new ioredis_1.default(url, { maxRetriesPerRequest: null });
        this.worker = new bullmq_1.Worker('notifications', async (job) => {
            const { recipient, title, message, priority } = job.data;
            this.logger.log(`[notificación] user=${recipient} prio=${priority ?? 'normal'} title="${title}" msg="${message}"`);
        }, { connection: this.connection, concurrency: 5 });
        this.logger.log('NotificationsProcessor worker activo');
    }
    async onModuleDestroy() {
        if (this.worker) {
            await this.worker.close().catch(() => undefined);
        }
        if (this.connection) {
            await this.connection.quit().catch(() => undefined);
        }
    }
};
exports.NotificationsProcessor = NotificationsProcessor;
exports.NotificationsProcessor = NotificationsProcessor = NotificationsProcessor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], NotificationsProcessor);
//# sourceMappingURL=notifications.processor.js.map