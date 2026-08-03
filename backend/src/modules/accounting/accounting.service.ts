import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Account } from './account.entity';
import { JournalEntry } from './journal-entry.entity';
import { JournalLine } from './journal-line.entity';
import { CreateAccountDto, CreateJournalEntryDto } from './dto/accounting.dto';
import { DomainException } from '../../common/domain-exceptions';
import { SettingsService } from '../settings/settings.service';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import { Request } from 'express';

/**
 * Contabilidad básica: plan de cuentas y asientos de diario con validación
 * de cuadratura (débitos = créditos). Punto de extensión para mayores y
 * estados financieros.
 */
@Injectable()
export class AccountingService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    @InjectRepository(JournalEntry)
    private readonly entryRepo: Repository<JournalEntry>,
    private readonly settingsService: SettingsService,
    private readonly auditService: AuditService,
    private readonly dataSource: DataSource,
  ) {}

  // ---------- Plan de cuentas ----------

  async listAccounts(): Promise<Account[]> {
    return this.accountRepo.find({ order: { code: 'ASC' } });
  }

  async createAccount(
    dto: CreateAccountDto,
    user: AuthUser,
    req: Request,
  ): Promise<Account> {
    try {
      const account = await this.accountRepo.save(
        this.accountRepo.create({ ...dto, parentId: dto.parentId ?? null }),
      );
      await this.auditService.record({
        userId: user.id,
        action: 'ACCOUNT:CREATE',
        resourceType: 'chart_of_accounts',
        resourceId: account.id,
        metadata: { code: dto.code, name: dto.name },
        request: req,
      });
      return account;
    } catch (err) {
      if (
        (err as { driverError?: { code?: string } }).driverError?.code ===
        '23505'
      ) {
        throw new DomainException(409, 'Ya existe una cuenta con ese código');
      }
      throw err;
    }
  }

  // ---------- Asientos ----------

  async createEntry(
    dto: CreateJournalEntryDto,
    user: AuthUser,
    req: Request,
  ): Promise<JournalEntry> {
    const totalDebit = this.round2(
      dto.lines.reduce((acc, l) => acc + l.debit, 0),
    );
    const totalCredit = this.round2(
      dto.lines.reduce((acc, l) => acc + l.credit, 0),
    );
    if (totalDebit !== totalCredit || totalDebit <= 0) {
      throw new DomainException(
        422,
        'El asiento no cuadra: la suma de débitos debe igualar a la de créditos y ser mayor a cero',
      );
    }
    for (const line of dto.lines) {
      if (line.debit > 0 && line.credit > 0) {
        throw new DomainException(
          422,
          'Una línea no puede tener débito y crédito a la vez',
        );
      }
      const account = await this.accountRepo.findOne({
        where: { id: line.accountId },
      });
      if (!account) {
        throw new DomainException(
          404,
          `Cuenta id ${line.accountId} no encontrada`,
        );
      }
    }

    const entryNumber = await this.nextEntryNumber(user.id);

    return this.dataSource.transaction(async (manager) => {
      const entry = manager.create(JournalEntry, {
        entryNumber,
        date: dto.date,
        description: dto.description ?? null,
        referenceType: dto.referenceType ?? null,
        referenceId: dto.referenceId ?? null,
        createdBy: user.id,
      });
      const savedEntry = await manager.save(JournalEntry, entry);

      const lines = dto.lines.map((l) =>
        manager.create(JournalLine, {
          entryId: savedEntry.id,
          accountId: l.accountId,
          debit: l.debit.toFixed(2),
          credit: l.credit.toFixed(2),
        }),
      );
      await manager.save(JournalLine, lines);

      await this.auditService.record({
        userId: user.id,
        action: 'JOURNAL:CREATE',
        resourceType: 'journal_entries',
        resourceId: savedEntry.id,
        metadata: { entryNumber, totalDebit },
        request: req,
      });

      const freshEntry = (await manager.findOne(JournalEntry, {
        where: { id: savedEntry.id },
      })) as JournalEntry;
      const savedLines = await manager.find(JournalLine, {
        where: { entryId: savedEntry.id },
        relations: ['account'],
        order: { id: 'ASC' },
      });
      return { ...freshEntry, lines: savedLines };
    });
  }

  async findOne(id: number): Promise<JournalEntry> {
    const entry = await this.entryRepo.findOne({ where: { id } });
    if (!entry) {
      throw new DomainException(404, 'Asiento no encontrado');
    }
    const lines = await this.dataSource.getRepository(JournalLine).find({
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

  /** Balance de comprobación: saldos por cuenta (deudor/acreedor). */
  async trialBalance(): Promise<
    { code: string; name: string; debit: number; credit: number }[]
  > {
    const rows = await this.dataSource
      .createQueryBuilder()
      .select('a.code', 'code')
      .addSelect('a.name', 'name')
      .addSelect('COALESCE(SUM(l.debit), 0)', 'debit')
      .addSelect('COALESCE(SUM(l.credit), 0)', 'credit')
      .from(JournalLine, 'l')
      .innerJoin('l.account', 'a')
      .groupBy('a.code')
      .addGroupBy('a.name')
      .orderBy('a.code', 'ASC')
      .getRawMany<{
        code: string;
        name: string;
        debit: string;
        credit: string;
      }>();

    return rows.map((r) => ({
      code: r.code,
      name: r.name,
      debit: Number(r.debit),
      credit: Number(r.credit),
    }));
  }

  private async nextEntryNumber(userId: number): Promise<string> {
    const settings = await this.settingsService.get<{
      value: Record<string, number>;
    }>('doc_sequence');
    const sequence = settings?.value ?? {};
    const current = sequence.journal ?? 1;
    sequence.journal = current + 1;
    await this.settingsService.set('doc_sequence', { value: sequence }, userId);
    return `ASI-${String(current).padStart(6, '0')}`;
  }

  private round2(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
