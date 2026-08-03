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
var ReportsProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsProcessor = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bullmq_1 = require("bullmq");
const ioredis_1 = require("ioredis");
const cache_service_1 = require("../../common/services/cache/cache.service");
const reports_service_1 = require("../reports/reports.service");
let ReportsProcessor = ReportsProcessor_1 = class ReportsProcessor {
    constructor(configService, cacheService, reportsService) {
        this.configService = configService;
        this.cacheService = cacheService;
        this.reportsService = reportsService;
        this.logger = new common_1.Logger(ReportsProcessor_1.name);
        this.worker = null;
        this.connection = null;
    }
    async onModuleInit() {
        const url = this.configService.get('REDIS_URL');
        if (!url) {
            this.logger.log('ReportsProcessor deshabilitado (sin Redis)');
            return;
        }
        this.connection = new ioredis_1.default(url, { maxRetriesPerRequest: null });
        this.worker = new bullmq_1.Worker('reports', async (job) => this.handle(job), { connection: this.connection, concurrency: 2 });
        this.worker.on('failed', (job, err) => {
            this.logger.error(`Reporte falló: ${err.message}`);
        });
        this.logger.log('ReportsProcessor worker activo');
    }
    async handle(job) {
        const { type, params, requestedBy } = job.data;
        this.logger.log(`Generando reporte "${type}" para usuario ${requestedBy}`);
        if (type === 'low-stock') {
            const result = await this.reportsService.lowStock(1, 500);
            await this.cacheService.set(`report:low-stock:${requestedBy}`, result, 900);
        }
        else if (type === 'sales-by-day') {
            const from = String(params.from ?? '');
            const to = String(params.to ?? '');
            const result = await this.reportsService.salesByDay(from, to);
            await this.cacheService.set(`report:sales-by-day:${requestedBy}`, result, 900);
        }
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
exports.ReportsProcessor = ReportsProcessor;
exports.ReportsProcessor = ReportsProcessor = ReportsProcessor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        cache_service_1.CacheService,
        reports_service_1.ReportsService])
], ReportsProcessor);
//# sourceMappingURL=reports.processor.js.map