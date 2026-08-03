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
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const settings_entity_1 = require("./settings.entity");
const domain_exceptions_1 = require("../../common/domain-exceptions");
let SettingsService = class SettingsService {
    constructor(settingRepo, historyRepo) {
        this.settingRepo = settingRepo;
        this.historyRepo = historyRepo;
        this.cache = new Map();
    }
    async onApplicationBootstrap() {
        await this.refreshCache();
    }
    async refreshCache() {
        const all = await this.settingRepo.find();
        this.cache.clear();
        for (const s of all) {
            this.cache.set(s.key, s.value);
        }
    }
    async get(key) {
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }
        const setting = await this.settingRepo.findOne({ where: { key } });
        if (!setting) {
            return null;
        }
        this.cache.set(key, setting.value);
        return setting.value;
    }
    async getTaxRate() {
        const tax = await this.get('tax_rate');
        return tax?.value ?? 0;
    }
    async getDefaultMarginPct() {
        const margin = await this.get('default_margin_pct');
        return margin?.value ?? 0;
    }
    async set(key, value, userId) {
        const existing = await this.settingRepo.findOne({ where: { key } });
        if (existing) {
            await this.historyRepo.save(this.historyRepo.create({
                key,
                value: existing.value,
                changedBy: userId,
            }));
            existing.value = value;
            existing.updatedBy = userId;
            await this.settingRepo.save(existing);
        }
        else {
            await this.settingRepo.save(this.settingRepo.create({ key, value, updatedBy: userId }));
        }
        this.cache.set(key, value);
        return this.settingRepo.findOneOrFail({ where: { key } });
    }
    async getAll() {
        return this.settingRepo.find();
    }
    async getHistory(key) {
        return this.historyRepo.find({
            where: { key },
            order: { changedAt: 'DESC' },
        });
    }
    async getSettingOrFail(key) {
        const s = await this.settingRepo.findOne({ where: { key } });
        if (!s) {
            throw new domain_exceptions_1.DomainException(404, `Parámetro "${key}" no configurado`);
        }
        return s;
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(settings_entity_1.Setting)),
    __param(1, (0, typeorm_1.InjectRepository)(settings_entity_1.SettingHistory)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], SettingsService);
//# sourceMappingURL=settings.service.js.map