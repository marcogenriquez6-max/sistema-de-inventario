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
exports.SettingHistory = exports.Setting = void 0;
const typeorm_1 = require("typeorm");
let Setting = class Setting {
};
exports.Setting = Setting;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ length: 60 }),
    __metadata("design:type", String)
], Setting.prototype, "key", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], Setting.prototype, "value", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'updated_by', nullable: true }),
    __metadata("design:type", Object)
], Setting.prototype, "updatedBy", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Setting.prototype, "updatedAt", void 0);
exports.Setting = Setting = __decorate([
    (0, typeorm_1.Entity)('settings')
], Setting);
let SettingHistory = class SettingHistory {
};
exports.SettingHistory = SettingHistory;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], SettingHistory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 60 }),
    __metadata("design:type", String)
], SettingHistory.prototype, "key", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], SettingHistory.prototype, "value", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'changed_by', nullable: true }),
    __metadata("design:type", Object)
], SettingHistory.prototype, "changedBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'changed_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], SettingHistory.prototype, "changedAt", void 0);
exports.SettingHistory = SettingHistory = __decorate([
    (0, typeorm_1.Entity)('settings_history')
], SettingHistory);
//# sourceMappingURL=settings.entity.js.map