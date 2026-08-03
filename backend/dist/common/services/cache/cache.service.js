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
var CacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = exports.CACHE_IS_REDIS = exports.CACHE_PROVIDER = void 0;
const common_1 = require("@nestjs/common");
exports.CACHE_PROVIDER = 'CACHE_PROVIDER';
exports.CACHE_IS_REDIS = 'CACHE_IS_REDIS';
let CacheService = CacheService_1 = class CacheService {
    constructor(provider, isRedis) {
        this.provider = provider;
        this.logger = new common_1.Logger(CacheService_1.name);
        this.isRedis = isRedis;
        if (isRedis) {
            this.logger.log('Cache provider: Redis');
        }
        else {
            this.logger.log('Cache provider: Memoria (REDIS_URL no definida)');
        }
    }
    get enabled() {
        return this.isRedis;
    }
    async get(key) {
        return this.provider.get(key);
    }
    async set(key, value, ttlSeconds) {
        await this.provider.set(key, value, ttlSeconds);
    }
    async del(key) {
        await this.provider.del(key);
    }
    async delPrefix(prefix) {
        await this.provider.delPrefix(prefix);
    }
    async remember(key, ttlSeconds, factory) {
        const cached = await this.get(key);
        if (cached !== null) {
            return cached;
        }
        const value = await factory();
        await this.set(key, value, ttlSeconds);
        return value;
    }
    async onModuleDestroy() {
    }
};
exports.CacheService = CacheService;
exports.CacheService = CacheService = CacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(exports.CACHE_PROVIDER)),
    __param(1, (0, common_1.Inject)(exports.CACHE_IS_REDIS)),
    __metadata("design:paramtypes", [Object, Boolean])
], CacheService);
//# sourceMappingURL=cache.service.js.map