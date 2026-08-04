import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AccountingService } from './accounting.service';
import { Account } from './account.entity';
import { JournalEntry } from './journal-entry.entity';
import { JournalLine } from './journal-line.entity';
import { SettingsService } from '../settings/settings.service';
import { AuditService } from '../audit/audit.service';
import { DomainException } from '../../common/domain-exceptions';

function mockTrialBalanceQb(rows: unknown[]) {
  const qb: Record<string, jest.Mock> = {};
  for (const m of [
    'select',
    'addSelect',
    'from',
    'innerJoin',
    'groupBy',
    'addGroupBy',
    'orderBy',
  ]) {
    qb[m] = jest.fn().mockReturnThis();
  }
  qb.getRawMany = jest.fn().mockResolvedValue(rows);
  return qb as never;
}

describe('AccountingService', () => {
  let service: AccountingService;
  let accountRepo: {
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
  };
  let entryRepo: { findOne: jest.Mock; findAndCount: jest.Mock };
  let settingsService: { get: jest.Mock; set: jest.Mock };
  let auditService: { record: jest.Mock };
  let dataSource: {
    transaction: jest.Mock;
    getRepository: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let manager: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    find: jest.Mock;
  };

  const actor = { id: 1, email: 'a@x.com', fullName: 'A', role: 'ADMIN' };
  const req = { ip: '127.0.0.1', headers: {} } as never;

  beforeEach(async () => {
    accountRepo = {
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn((d) => d),
      save: jest.fn((d) => Promise.resolve({ id: 1, ...d })),
      findOne: jest.fn().mockResolvedValue({ id: 10, code: '1101' }),
    };
    entryRepo = {
      findOne: jest.fn(),
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    settingsService = {
      get: jest.fn().mockResolvedValue({ journal: 1 }),
      set: jest.fn().mockResolvedValue({}),
    };
    auditService = { record: jest.fn().mockResolvedValue(undefined) };

    manager = {
      create: jest.fn((_e, d) => d),
      save: jest.fn((_e, d) =>
        Promise.resolve(Array.isArray(d) ? d : { id: 5, ...d }),
      ),
      findOne: jest
        .fn()
        .mockResolvedValue({ id: 5, entryNumber: 'ASI-000001' }),
      find: jest.fn().mockResolvedValue([{ id: 1, account: { code: '1101' } }]),
    };
    dataSource = {
      transaction: jest.fn(
        async (cb: (m: typeof manager) => Promise<unknown>) => cb(manager),
      ),
      getRepository: jest.fn().mockReturnValue({
        find: jest.fn().mockResolvedValue([{ id: 1 }]),
      }),
      createQueryBuilder: jest.fn().mockReturnValue(mockTrialBalanceQb([])),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountingService,
        { provide: getRepositoryToken(Account), useValue: accountRepo },
        { provide: getRepositoryToken(JournalEntry), useValue: entryRepo },
        { provide: SettingsService, useValue: settingsService },
        { provide: AuditService, useValue: auditService },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get(AccountingService);
  });

  afterEach(() => jest.clearAllMocks());

  it('listAccounts ordena por código', async () => {
    await service.listAccounts();

    expect(accountRepo.find).toHaveBeenCalledWith({ order: { code: 'ASC' } });
  });

  it('createAccount guarda y audita', async () => {
    const saved = await service.createAccount(
      { code: '1101', name: 'Caja General', type: 'ASSET' },
      actor,
      req,
    );

    expect(saved.code).toBe('1101');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'ACCOUNT:CREATE' }),
    );
  });

  it('createAccount convierte violación de unicidad en 409', async () => {
    accountRepo.save.mockRejectedValue({ driverError: { code: '23505' } });

    await expect(
      service.createAccount(
        { code: '1101', name: 'Caja', type: 'ASSET' },
        actor,
        req,
      ),
    ).rejects.toThrow(DomainException);
  });

  it('createEntry rechaza un asiento descuadrado', async () => {
    await expect(
      service.createEntry(
        {
          date: '2026-08-03',
          lines: [
            { accountId: 1, debit: 100, credit: 0 },
            { accountId: 2, debit: 0, credit: 90 },
          ],
        },
        actor,
        req,
      ),
    ).rejects.toThrow('no cuadra');
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('createEntry rechaza una línea con débito y crédito', async () => {
    await expect(
      service.createEntry(
        {
          date: '2026-08-03',
          lines: [
            { accountId: 1, debit: 100, credit: 10 },
            { accountId: 2, debit: 0, credit: 90 },
          ],
        },
        actor,
        req,
      ),
    ).rejects.toThrow('no puede tener débito y crédito');
  });

  it('createEntry valida que las cuentas existan', async () => {
    accountRepo.findOne.mockResolvedValue(null);

    await expect(
      service.createEntry(
        {
          date: '2026-08-03',
          lines: [
            { accountId: 999, debit: 100, credit: 0 },
            { accountId: 2, debit: 0, credit: 100 },
          ],
        },
        actor,
        req,
      ),
    ).rejects.toThrow('Cuenta id 999 no encontrada');
  });

  it('createEntry persiste el asiento con su número secuencial', async () => {
    const result = await service.createEntry(
      {
        date: '2026-08-03',
        description: 'Asiento de venta',
        lines: [
          { accountId: 1, debit: 100, credit: 0 },
          { accountId: 2, debit: 0, credit: 100 },
        ],
      },
      actor,
      req,
    );

    expect(settingsService.get).toHaveBeenCalledWith('doc_sequence');
    expect(settingsService.set).toHaveBeenCalledWith(
      'doc_sequence',
      { value: { journal: 2 } },
      actor.id,
    );
    expect(manager.save).toHaveBeenCalledWith(
      JournalEntry,
      expect.objectContaining({ entryNumber: 'ASI-000001' }),
    );
    expect(result.entryNumber).toBe('ASI-000001');
    expect(result.lines).toHaveLength(1);
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'JOURNAL:CREATE' }),
    );
  });

  it('findOne lanza 404 si el asiento no existe', async () => {
    entryRepo.findOne.mockResolvedValue(null);

    await expect(service.findOne(9)).rejects.toThrow('Asiento no encontrado');
  });

  it('findOne devuelve el asiento con sus líneas', async () => {
    entryRepo.findOne.mockResolvedValue({ id: 1 });

    const result = await service.findOne(1);

    expect(result.lines).toHaveLength(1);
    expect(dataSource.getRepository).toHaveBeenCalledWith(JournalLine);
  });

  it('listEntries pagina los asientos', async () => {
    entryRepo.findAndCount.mockResolvedValue([[{ id: 1 }], 1]);

    const result = await service.listEntries(1, 20);

    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('trialBalance convierte los agregados a números', async () => {
    dataSource.createQueryBuilder.mockReturnValue(
      mockTrialBalanceQb([
        { code: '1101', name: 'Caja', debit: '100', credit: '0' },
      ]),
    );

    const result = await service.trialBalance();

    expect(result).toEqual([
      { code: '1101', name: 'Caja', debit: 100, credit: 0 },
    ]);
  });
});
