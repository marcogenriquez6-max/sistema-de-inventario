"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashRegisterModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const cash_register_entity_1 = require("./cash-register.entity");
const cash_movement_entity_1 = require("./cash-movement.entity");
const cash_register_service_1 = require("./cash-register.service");
const cash_register_controller_1 = require("./cash-register.controller");
const audit_module_1 = require("../audit/audit.module");
let CashRegisterModule = class CashRegisterModule {
};
exports.CashRegisterModule = CashRegisterModule;
exports.CashRegisterModule = CashRegisterModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([cash_register_entity_1.CashRegister, cash_movement_entity_1.CashMovement]),
            audit_module_1.AuditModule,
        ],
        controllers: [cash_register_controller_1.CashRegisterController],
        providers: [cash_register_service_1.CashRegisterService],
        exports: [cash_register_service_1.CashRegisterService],
    })
], CashRegisterModule);
//# sourceMappingURL=cash-register.module.js.map