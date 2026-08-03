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
exports.CashRegisterService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const cash_register_entity_1 = require("./cash-register.entity");
const cash_movement_entity_1 = require("./cash-movement.entity");
const domain_exceptions_1 = require("../../common/domain-exceptions");
const audit_service_1 = require("../audit/audit.service");
let CashRegisterService = class CashRegisterService {
    constructor(registerRepo, movementRepo, auditService, dataSource) {
        this.registerRepo = registerRepo;
        this.movementRepo = movementRepo;
        this.auditService = auditService;
        this.dataSource = dataSource;
    }
    async getOpenRegister(userId) {
        return this.registerRepo.findOne({
            where: { openedBy: userId, status: 'OPEN' },
        });
    }
    async openRegister(dto, user, req) {
        const existing = await this.getOpenRegister(user.id);
        if (existing) {
            throw new domain_exceptions_1.DomainException(409, 'Ya tienes una caja abierta');
        }
        const register = this.registerRepo.create({
            openedBy: user.id,
            initialBalance: dto.initialBalance.toFixed(2),
            expected: dto.initialBalance.toFixed(2),
            status: 'OPEN',
        });
        const saved = await this.registerRepo.save(register);
        await this.auditService.record({
            userId: user.id,
            action: 'CASH:OPEN',
            resourceType: 'cash_registers',
            resourceId: saved.id,
            metadata: { initialBalance: dto.initialBalance },
            request: req,
        });
        return saved;
    }
    async addMovement(registerId, dto, user, req) {
        const register = await this.registerRepo.findOne({
            where: { id: registerId },
        });
        if (!register || register.status !== 'OPEN') {
            throw new domain_exceptions_1.DomainException(409, 'La caja no está abierta');
        }
        return this.dataSource.transaction(async (manager) => {
            const locked = await manager.findOne(cash_register_entity_1.CashRegister, {
                where: { id: registerId },
                lock: { mode: 'pessimistic_write' },
            });
            if (!locked || locked.status !== 'OPEN') {
                throw new domain_exceptions_1.DomainException(409, 'La caja no está abierta');
            }
            const sign = dto.movementType === 'INCOME' ? 1 : -1;
            locked.expected = (Number(locked.expected) + sign * dto.amount).toFixed(2);
            await manager.save(cash_register_entity_1.CashRegister, locked);
            const movement = manager.create(cash_movement_entity_1.CashMovement, {
                registerId,
                movementType: dto.movementType,
                amount: dto.amount.toFixed(2),
                description: dto.description ?? null,
                userId: user.id,
            });
            await manager.save(cash_movement_entity_1.CashMovement, movement);
            await this.auditService.record({
                userId: user.id,
                action: `CASH:${dto.movementType}`,
                resourceType: 'cash_movements',
                resourceId: movement.id,
                metadata: { registerId, amount: dto.amount },
                request: req,
            });
            return movement;
        });
    }
    async closeRegister(registerId, dto, user, req) {
        return this.dataSource.transaction(async (manager) => {
            const register = await manager.findOne(cash_register_entity_1.CashRegister, {
                where: { id: registerId },
                lock: { mode: 'pessimistic_write' },
            });
            if (!register || register.status !== 'OPEN') {
                throw new domain_exceptions_1.DomainException(409, 'La caja no está abierta o ya fue cerrada');
            }
            const expected = Number(register.expected);
            const difference = this.round2(dto.countedAmount - expected);
            register.status = 'CLOSED';
            register.countedAmount = dto.countedAmount.toFixed(2);
            register.difference = difference.toFixed(2);
            register.closedBy = user.id;
            register.closedAt = new Date();
            const saved = await manager.save(cash_register_entity_1.CashRegister, register);
            await this.auditService.record({
                userId: user.id,
                action: 'CASH:CLOSE',
                resourceType: 'cash_registers',
                resourceId: registerId,
                metadata: { expected, counted: dto.countedAmount, difference },
                request: req,
            });
            return saved;
        });
    }
    async getMovements(registerId, page, pageSize) {
        const [items, total] = await this.movementRepo.findAndCount({
            where: { registerId },
            relations: ['user'],
            order: { createdAt: 'ASC' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });
        return { items, total, page, pageSize };
    }
    round2(value) {
        return Math.round((value + Number.EPSILON) * 100) / 100;
    }
};
exports.CashRegisterService = CashRegisterService;
exports.CashRegisterService = CashRegisterService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(cash_register_entity_1.CashRegister)),
    __param(1, (0, typeorm_1.InjectRepository)(cash_movement_entity_1.CashMovement)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        audit_service_1.AuditService,
        typeorm_2.DataSource])
], CashRegisterService);
//# sourceMappingURL=cash-register.service.js.map