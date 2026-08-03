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
var JobsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bullmq_1 = require("bullmq");
const ioredis_1 = require("ioredis");
let JobsService = JobsService_1 = class JobsService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(JobsService_1.name);
        this.connection = null;
        this.queues = new Map();
        const url = this.configService.get('REDIS_URL');
        this.enabled = Boolean(url);
        this.connection = url
            ? new ioredis_1.default(url, { maxRetriesPerRequest: null })
            : null;
    }
    get isEnabled() {
        return this.enabled;
    }
    async onModuleInit() {
        if (!this.enabled) {
            this.logger.log('BullMQ deshabilitado (REDIS_URL no definida)');
            return;
        }
        this.queues.set('reports', new bullmq_1.Queue('reports', { connection: this.connection }));
        this.queues.set('notifications', new bullmq_1.Queue('notifications', { connection: this.connection }));
        this.logger.log('BullMQ colas listas: reports, notifications');
    }
    async onModuleDestroy() {
        for (const q of this.queues.values()) {
            await q.close().catch(() => undefined);
        }
        if (this.connection) {
            await this.connection.quit().catch(() => undefined);
        }
    }
    async enqueueReport(data) {
        await this.add('reports', 'generate', data);
    }
    async enqueueNotification(data) {
        await this.add('notifications', 'send', data, {
            priority: data.priority === 'high' ? 1 : 2,
        });
    }
    async add(queueName, jobName, data, opts) {
        const queue = this.queues.get(queueName);
        if (!queue) {
            this.logger.warn(`Cola "${queueName}" no disponible; tarea "${jobName}" omitida`);
            return;
        }
        await queue.add(jobName, data, {
            priority: opts?.priority,
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
        });
    }
};
exports.JobsService = JobsService;
exports.JobsService = JobsService = JobsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], JobsService);
//# sourceMappingURL=jobs.service.js.map