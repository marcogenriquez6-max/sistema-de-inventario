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
exports.CacheModule = exports.REDIS_CLIENT = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = require("ioredis");
const cache_service_1 = require("./cache.service");
const cache_providers_1 = require("./cache.providers");
exports.REDIS_CLIENT = 'REDIS_CLIENT';
let CacheModule = class CacheModule {
    constructor(redisClient) {
        this.redisClient = redisClient;
    }
    async onModuleDestroy() {
        if (this.redisClient) {
            await this.redisClient.quit().catch(() => undefined);
        }
    }
};
exports.CacheModule = CacheModule;
exports.CacheModule = CacheModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [
            {
                provide: exports.REDIS_CLIENT,
                inject: [config_1.ConfigService],
                useFactory: (config) => {
                    const url = config.get('REDIS_URL');
                    return url
                        ? new ioredis_1.default(url, { maxRetriesPerRequest: 1, lazyConnect: true })
                        : null;
                },
            },
            {
                provide: cache_service_1.CACHE_PROVIDER,
                inject: [exports.REDIS_CLIENT],
                useFactory: (client) => client ? new cache_providers_1.RedisCacheProvider(client) : new cache_providers_1.MemoryCacheProvider(),
            },
            {
                provide: cache_service_1.CACHE_IS_REDIS,
                inject: [exports.REDIS_CLIENT],
                useFactory: (client) => client !== null,
            },
            cache_service_1.CacheService,
        ],
        exports: [cache_service_1.CacheService],
    }),
    __param(0, (0, common_1.Inject)(exports.REDIS_CLIENT)),
    __metadata("design:paramtypes", [Object])
], CacheModule);
//# sourceMappingURL=cache.module.js.map