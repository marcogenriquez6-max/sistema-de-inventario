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
exports.BankingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bank_account_entity_1 = require("./bank-account.entity");
const bank_movement_entity_1 = require("./bank-movement.entity");
const domain_exceptions_1 = require("../../common/domain-exceptions");
const paginated_interface_1 = require("../../common/interfaces/paginated.interface");
const audit_service_1 = require("../audit/audit.service");
let BankingService = class BankingService {
    constructor(accountRepo, movementRepo, auditService, dataSource) {
        this.accountRepo = accountRepo;
        this.movementRepo = movementRepo;
        this.auditService = auditService;
        this.dataSource = dataSource;
    }
    async listAccounts() {
        return this.accountRepo.find({ order: { name: 'ASC' } });
    }
    async createAccount(dto, user, req) {
        const account = await this.accountRepo.save(this.accountRepo.create({
            ...dto,
            accountType: dto.accountType ?? 'SAVINGS',
            currency: dto.currency ?? 'BOB',
            balance: (dto.balance ?? 0).toFixed(2),
        }));
        await this.auditService.record({
            userId: user.id,
            action: 'BANK:ACCOUNT_CREATE',
            resourceType: 'bank_accounts',
            resourceId: account.id,
            metadata: { name: dto.name, bank: dto.bank },
            request: req,
        });
        return account;
    }
    async addMovement(accountId, dto, user, req) {
        return this.dataSource.transaction(async (manager) => {
            const account = await manager.findOne(bank_account_entity_1.BankAccount, {
                where: { id: accountId },
                lock: { mode: 'pessimistic_write' },
            });
            if (!account) {
                throw new domain_exceptions_1.DomainException(404, 'Cuenta bancaria no encontrada');
            }
            const sign = dto.movementType === 'DEPOSIT' ? 1 : -1;
            const newBalance = Number(account.balance) + sign * dto.amount;
            if (newBalance < 0) {
                throw new domain_exceptions_1.DomainException(409, 'Saldo insuficiente en la cuenta', {
                    balance: Number(account.balance),
                });
            }
            account.balance = newBalance.toFixed(2);
            await manager.save(bank_account_entity_1.BankAccount, account);
            const movement = manager.create(bank_movement_entity_1.BankMovement, {
                accountId,
                movementType: dto.movementType,
                amount: dto.amount.toFixed(2),
                description: dto.description ?? null,
                userId: user.id,
            });
            await manager.save(bank_movement_entity_1.BankMovement, movement);
            await this.auditService.record({
                userId: user.id,
                action: `BANK:${dto.movementType}`,
                resourceType: 'bank_movements',
                resourceId: movement.id,
                metadata: { accountId, amount: dto.amount },
                request: req,
            });
            return movement;
        });
    }
    async transfer(fromAccountId, dto, user, req) {
        if (fromAccountId === dto.toAccountId) {
            throw new domain_exceptions_1.DomainException(422, 'No se puede transferir a la misma cuenta');
        }
        await this.dataSource.transaction(async (manager) => {
            const from = await manager.findOne(bank_account_entity_1.BankAccount, {
                where: { id: fromAccountId },
                lock: { mode: 'pessimistic_write' },
            });
            const to = await manager.findOne(bank_account_entity_1.BankAccount, {
                where: { id: dto.toAccountId },
                lock: { mode: 'pessimistic_write' },
            });
            if (!from || !to) {
                throw new domain_exceptions_1.DomainException(404, 'Cuenta bancaria no encontrada');
            }
            if (Number(from.balance) < dto.amount) {
                throw new domain_exceptions_1.DomainException(409, 'Saldo insuficiente en la cuenta origen');
            }
            from.balance = (Number(from.balance) - dto.amount).toFixed(2);
            to.balance = (Number(to.balance) + dto.amount).toFixed(2);
            await manager.save(bank_account_entity_1.BankAccount, from);
            await manager.save(bank_account_entity_1.BankAccount, to);
            await manager.save(manager.create(bank_movement_entity_1.BankMovement, {
                accountId: from.id,
                movementType: 'TRANSFER_OUT',
                amount: dto.amount.toFixed(2),
                description: dto.description ?? 'Transferencia',
                userId: user.id,
            }));
            await manager.save(manager.create(bank_movement_entity_1.BankMovement, {
                accountId: to.id,
                movementType: 'TRANSFER_IN',
                amount: dto.amount.toFixed(2),
                description: dto.description ?? 'Transferencia',
                userId: user.id,
            }));
        });
        await this.auditService.record({
            userId: user.id,
            action: 'BANK:TRANSFER',
            resourceType: 'bank_movements',
            metadata: {
                from: fromAccountId,
                to: dto.toAccountId,
                amount: dto.amount,
            },
            request: req,
        });
    }
    async movements(accountId, page = 1, pageSize = 20) {
        const [items, total] = await this.movementRepo.findAndCount({
            where: { accountId },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });
        return (0, paginated_interface_1.toPaginated)(items, total, page, pageSize);
    }
};
exports.BankingService = BankingService;
exports.BankingService = BankingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(bank_account_entity_1.BankAccount)),
    __param(1, (0, typeorm_1.InjectRepository)(bank_movement_entity_1.BankMovement)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        audit_service_1.AuditService,
        typeorm_2.DataSource])
], BankingService);
//# sourceMappingURL=banking.service.js.map