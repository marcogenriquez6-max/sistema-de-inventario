"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankingModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const bank_account_entity_1 = require("./bank-account.entity");
const bank_movement_entity_1 = require("./bank-movement.entity");
const banking_service_1 = require("./banking.service");
const banking_controller_1 = require("./banking.controller");
const audit_module_1 = require("../audit/audit.module");
let BankingModule = class BankingModule {
};
exports.BankingModule = BankingModule;
exports.BankingModule = BankingModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([bank_account_entity_1.BankAccount, bank_movement_entity_1.BankMovement]), audit_module_1.AuditModule],
        controllers: [banking_controller_1.BankingController],
        providers: [banking_service_1.BankingService],
        exports: [banking_service_1.BankingService],
    })
], BankingModule);
//# sourceMappingURL=banking.module.js.map