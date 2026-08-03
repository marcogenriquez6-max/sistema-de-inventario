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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingService = void 0;
const common_1 = require("@nestjs/common");
const settings_service_1 = require("../settings/settings.service");
let PricingService = class PricingService {
    constructor(settingsService) {
        this.settingsService = settingsService;
    }
    round2(value) {
        return Math.round((value + Number.EPSILON) * 100) / 100;
    }
    async getTaxRate() {
        return this.settingsService.getTaxRate();
    }
    async computeSalePrice(basePrice, taxRate) {
        const tax = taxRate ?? (await this.getTaxRate());
        return this.round2(basePrice * (1 + tax / 100));
    }
    async computeSuggestedBasePrice(costPrice) {
        const margin = await this.settingsService.getDefaultMarginPct();
        return this.round2(costPrice * (1 + margin / 100));
    }
    async breakdown(costPrice, basePrice, taxRate) {
        const tax = taxRate ?? (await this.getTaxRate());
        const salePrice = await this.computeSalePrice(basePrice, tax);
        const marginPct = costPrice > 0 ? ((basePrice - costPrice) / costPrice) * 100 : 0;
        const taxAmount = this.round2(salePrice - basePrice);
        return {
            costPrice: this.round2(costPrice),
            basePrice: this.round2(basePrice),
            salePrice,
            taxRate: tax,
            taxAmount,
            marginPct: this.round2(marginPct),
        };
    }
    round(value) {
        return this.round2(value);
    }
};
exports.PricingService = PricingService;
exports.PricingService = PricingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [settings_service_1.SettingsService])
], PricingService);
//# sourceMappingURL=pricing.service.js.map