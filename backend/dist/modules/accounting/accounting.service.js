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
exports.AccountingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const account_entity_1 = require("./account.entity");
const journal_entry_entity_1 = require("./journal-entry.entity");
const journal_line_entity_1 = require("./journal-line.entity");
const domain_exceptions_1 = require("../../common/domain-exceptions");
const settings_service_1 = require("../settings/settings.service");
const audit_service_1 = require("../audit/audit.service");
let AccountingService = class AccountingService {
    constructor(accountRepo, entryRepo, settingsService, auditService, dataSource) {
        this.accountRepo = accountRepo;
        this.entryRepo = entryRepo;
        this.settingsService = settingsService;
        this.auditService = auditService;
        this.dataSource = dataSource;
    }
    async listAccounts() {
        return this.accountRepo.find({ order: { code: 'ASC' } });
    }
    async createAccount(dto, user, req) {
        try {
            const account = await this.accountRepo.save(this.accountRepo.create({ ...dto, parentId: dto.parentId ?? null }));
            await this.auditService.record({
                userId: user.id,
                action: 'ACCOUNT:CREATE',
                resourceType: 'chart_of_accounts',
                resourceId: account.id,
                metadata: { code: dto.code, name: dto.name },
                request: req,
            });
            return account;
        }
        catch (err) {
            if (err.driverError?.code ===
                '23505') {
                throw new domain_exceptions_1.DomainException(409, 'Ya existe una cuenta con ese código');
            }
            throw err;
        }
    }
    async createEntry(dto, user, req) {
        const totalDebit = this.round2(dto.lines.reduce((acc, l) => acc + l.debit, 0));
        const totalCredit = this.round2(dto.lines.reduce((acc, l) => acc + l.credit, 0));
        if (totalDebit !== totalCredit || totalDebit <= 0) {
            throw new domain_exceptions_1.DomainException(422, 'El asiento no cuadra: la suma de débitos debe igualar a la de créditos y ser mayor a cero');
        }
        for (const line of dto.lines) {
            if (line.debit > 0 && line.credit > 0) {
                throw new domain_exceptions_1.DomainException(422, 'Una línea no puede tener débito y crédito a la vez');
            }
            const account = await this.accountRepo.findOne({
                where: { id: line.accountId },
            });
            if (!account) {
                throw new domain_exceptions_1.DomainException(404, `Cuenta id ${line.accountId} no encontrada`);
            }
        }
        const entryNumber = await this.nextEntryNumber(user.id);
        return this.dataSource.transaction(async (manager) => {
            const entry = manager.create(journal_entry_entity_1.JournalEntry, {
                entryNumber,
                date: dto.date,
                description: dto.description ?? null,
                referenceType: dto.referenceType ?? null,
                referenceId: dto.referenceId ?? null,
                createdBy: user.id,
            });
            const savedEntry = await manager.save(journal_entry_entity_1.JournalEntry, entry);
            const lines = dto.lines.map((l) => manager.create(journal_line_entity_1.JournalLine, {
                entryId: savedEntry.id,
                accountId: l.accountId,
                debit: l.debit.toFixed(2),
                credit: l.credit.toFixed(2),
            }));
            await manager.save(journal_line_entity_1.JournalLine, lines);
            await this.auditService.record({
                userId: user.id,
                action: 'JOURNAL:CREATE',
                resourceType: 'journal_entries',
                resourceId: savedEntry.id,
                metadata: { entryNumber, totalDebit },
                request: req,
            });
            const freshEntry = (await manager.findOne(journal_entry_entity_1.JournalEntry, {
                where: { id: savedEntry.id },
            }));
            const savedLines = await manager.find(journal_line_entity_1.JournalLine, {
                where: { entryId: savedEntry.id },
                relations: ['account'],
                order: { id: 'ASC' },
            });
            return { ...freshEntry, lines: savedLines };
        });
    }
    async findOne(id) {
        const entry = await this.entryRepo.findOne({ where: { id } });
        if (!entry) {
            throw new domain_exceptions_1.DomainException(404, 'Asiento no encontrado');
        }
        const lines = await this.dataSource.getRepository(journal_line_entity_1.JournalLine).find({
            where: { entryId: id },
            relations: ['account'],
            order: { id: 'ASC' },
        });
        return { ...entry, lines };
    }
    async listEntries(page = 1, pageSize = 20) {
        const [items, total] = await this.entryRepo.findAndCount({
            order: { createdAt: 'DESC' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });
        return { items, total, page, pageSize };
    }
    async trialBalance() {
        const rows = await this.dataSource
            .createQueryBuilder()
            .select('a.code', 'code')
            .addSelect('a.name', 'name')
            .addSelect('COALESCE(SUM(l.debit), 0)', 'debit')
            .addSelect('COALESCE(SUM(l.credit), 0)', 'credit')
            .from(journal_line_entity_1.JournalLine, 'l')
            .innerJoin('l.account', 'a')
            .groupBy('a.code')
            .addGroupBy('a.name')
            .orderBy('a.code', 'ASC')
            .getRawMany();
        return rows.map((r) => ({
            code: r.code,
            name: r.name,
            debit: Number(r.debit),
            credit: Number(r.credit),
        }));
    }
    async nextEntryNumber(userId) {
        const settings = await this.settingsService.get('doc_sequence');
        const sequence = settings?.value ?? {};
        const current = sequence.journal ?? 1;
        sequence.journal = current + 1;
        await this.settingsService.set('doc_sequence', { value: sequence }, userId);
        return `ASI-${String(current).padStart(6, '0')}`;
    }
    round2(value) {
        return Math.round((value + Number.EPSILON) * 100) / 100;
    }
};
exports.AccountingService = AccountingService;
exports.AccountingService = AccountingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(account_entity_1.Account)),
    __param(1, (0, typeorm_1.InjectRepository)(journal_entry_entity_1.JournalEntry)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        settings_service_1.SettingsService,
        audit_service_1.AuditService,
        typeorm_2.DataSource])
], AccountingService);
//# sourceMappingURL=accounting.service.js.map