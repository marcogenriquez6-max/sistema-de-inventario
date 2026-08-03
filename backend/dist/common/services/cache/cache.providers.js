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
var RedisCacheProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisCacheProvider = exports.MemoryCacheProvider = void 0;
const common_1 = require("@nestjs/common");
let MemoryCacheProvider = class MemoryCacheProvider {
    constructor() {
        this.store = new Map();
    }
    async get(key) {
        const entry = this.store.get(key);
        if (!entry) {
            return null;
        }
        if (entry.expiresAt !== 0 && entry.expiresAt < Date.now()) {
            this.store.delete(key);
            return null;
        }
        return entry.value;
    }
    async set(key, value, ttlSeconds = 60) {
        this.store.set(key, {
            value,
            expiresAt: ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : 0,
        });
    }
    async del(key) {
        this.store.delete(key);
    }
    async delPrefix(prefix) {
        for (const key of this.store.keys()) {
            if (key.startsWith(prefix)) {
                this.store.delete(key);
            }
        }
    }
};
exports.MemoryCacheProvider = MemoryCacheProvider;
exports.MemoryCacheProvider = MemoryCacheProvider = __decorate([
    (0, common_1.Injectable)()
], MemoryCacheProvider);
let RedisCacheProvider = RedisCacheProvider_1 = class RedisCacheProvider {
    constructor(redisClient) {
        this.redisClient = redisClient;
        this.logger = new common_1.Logger(RedisCacheProvider_1.name);
    }
    async get(key) {
        try {
            const raw = await this.redisClient.get(key);
            return raw ? JSON.parse(raw) : null;
        }
        catch (err) {
            this.logger.warn(`Redis get failed: ${err.message}`);
            return null;
        }
    }
    async set(key, value, ttlSeconds = 60) {
        try {
            const raw = JSON.stringify(value);
            if (ttlSeconds > 0) {
                await this.redisClient.set(key, raw, 'EX', ttlSeconds);
            }
            else {
                await this.redisClient.set(key, raw);
            }
        }
        catch (err) {
            this.logger.warn(`Redis set failed: ${err.message}`);
        }
    }
    async del(key) {
        await this.redisClient.del(key).catch(() => undefined);
    }
    async delPrefix(prefix) {
        try {
            const keys = await this.redisClient.keys(`${prefix}*`);
            if (keys.length > 0) {
                await this.redisClient.del(...keys);
            }
        }
        catch (err) {
            this.logger.warn(`Redis delPrefix failed: ${err.message}`);
        }
    }
};
exports.RedisCacheProvider = RedisCacheProvider;
exports.RedisCacheProvider = RedisCacheProvider = RedisCacheProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object])
], RedisCacheProvider);
//# sourceMappingURL=cache.providers.js.map