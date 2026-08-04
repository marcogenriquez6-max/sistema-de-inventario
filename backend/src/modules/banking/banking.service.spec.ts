import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BankingService } from './banking.service';
import { BankAccount } from './bank-account.entity';
import { BankMovement } from './bank-movement.entity';
import { AuditService } from '../audit/audit.service';
import { DomainException } from '../../common/domain-exceptions';

describe('BankingService', () => {
  let service: BankingService;
  let accountRepo: {
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    findAndCount: jest.Mock;
  };
  let movementRepo: { findAndCount: jest.Mock };
  let auditService: { record: jest.Mock };
  let dataSource: { transaction: jest.Mock };
  let manager: {
    findOne: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
  };

  const actor = { id: 1, email: 'a@x.com', fullName: 'A', role: 'ADMIN' };
  const req = { ip: '127.0.0.1', headers: {} } as never;

  beforeEach(async () => {
    accountRepo = {
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn((d) => d),
      save: jest.fn((d) => Promise.resolve({ id: 1, ...d })),
      findAndCount: jest.fn(),
    };
    movementRepo = { findAndCount: jest.fn().mockResolvedValue([[], 0]) };
    auditService = { record: jest.fn().mockResolvedValue(undefined) };

    manager = {
      findOne: jest.fn(),
      save: jest.fn((_e, d) => Promise.resolve(d)),
      create: jest.fn((_e, d) => d),
    };
    dataSource = {
      transaction: jest.fn(
        async (cb: (m: typeof manager) => Promise<unknown>) => cb(manager),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BankingService,
        { provide: getRepositoryToken(BankAccount), useValue: accountRepo },
        { provide: getRepositoryToken(BankMovement), useValue: movementRepo },
        { provide: AuditService, useValue: auditService },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get(BankingService);
  });

  afterEach(() => jest.clearAllMocks());

  it('listAccounts ordena por nombre', async () => {
    await service.listAccounts();

    expect(accountRepo.find).toHaveBeenCalledWith({ order: { name: 'ASC' } });
  });

  it('createAccount aplica defaults y audita', async () => {
    await service.createAccount(
      { name: 'CTA Operativa', bank: 'Banco Unión' },
      actor,
      req,
    );

    expect(accountRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        accountType: 'SAVINGS',
        currency: 'BOB',
        balance: '0.00',
      }),
    );
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'BANK:ACCOUNT_CREATE' }),
    );
  });

  it('addMovement deposita y actualiza el saldo', async () => {
    manager.findOne.mockResolvedValue({ id: 1, balance: '100.00' });

    const movement = await service.addMovement(
      1,
      { movementType: 'DEPOSIT', amount: 50 },
      actor,
      req,
    );

    expect(movement.movementType).toBe('DEPOSIT');
    expect(manager.save).toHaveBeenCalledWith(
      BankAccount,
      expect.objectContaining({ balance: '150.00' }),
    );
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'BANK:DEPOSIT' }),
    );
  });

  it('addMovement lanza 404 si la cuenta no existe', async () => {
    manager.findOne.mockResolvedValue(null);

    await expect(
      service.addMovement(
        9,
        { movementType: 'DEPOSIT', amount: 10 },
        actor,
        req,
      ),
    ).rejects.toThrow('Cuenta bancaria no encontrada');
  });

  it('addMovement rechaza un retiro sin saldo suficiente', async () => {
    manager.findOne.mockResolvedValue({ id: 1, balance: '10.00' });

    await expect(
      service.addMovement(
        1,
        { movementType: 'WITHDRAWAL', amount: 50 },
        actor,
        req,
      ),
    ).rejects.toThrow(DomainException);
  });

  it('transfer rechaza transferir a la misma cuenta', async () => {
    await expect(
      service.transfer(1, { toAccountId: 1, amount: 100 }, actor, req),
    ).rejects.toThrow(DomainException);
  });

  it('transfer mueve saldo entre cuentas y crea dos movimientos', async () => {
    manager.findOne
      .mockResolvedValueOnce({ id: 1, balance: '500.00' })
      .mockResolvedValueOnce({ id: 2, balance: '100.00' });

    await service.transfer(
      1,
      { toAccountId: 2, amount: 200, description: 'Traspaso' },
      actor,
      req,
    );

    expect(manager.save).toHaveBeenCalledWith(
      BankAccount,
      expect.objectContaining({ id: 1, balance: '300.00' }),
    );
    expect(manager.save).toHaveBeenCalledWith(
      BankAccount,
      expect.objectContaining({ id: 2, balance: '300.00' }),
    );
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'BANK:TRANSFER' }),
    );
  });

  it('transfer lanza 404 si alguna cuenta no existe', async () => {
    manager.findOne.mockResolvedValueOnce({ id: 1, balance: '500.00' });
    manager.findOne.mockResolvedValueOnce(null);

    await expect(
      service.transfer(1, { toAccountId: 2, amount: 10 }, actor, req),
    ).rejects.toThrow('Cuenta bancaria no encontrada');
  });

  it('movements pagina los movimientos de una cuenta', async () => {
    movementRepo.findAndCount.mockResolvedValue([[{ id: 1 }], 1]);

    const result = await service.movements(1, 1, 20);

    expect(result.items).toHaveLength(1);
    expect(result.meta.totalItems).toBe(1);
  });
});
