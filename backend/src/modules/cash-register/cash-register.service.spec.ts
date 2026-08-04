import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CashRegisterService } from './cash-register.service';
import { CashRegister } from './cash-register.entity';
import { CashMovement } from './cash-movement.entity';
import { AuditService } from '../audit/audit.service';
import { DomainException } from '../../common/domain-exceptions';

describe('CashRegisterService', () => {
  let service: CashRegisterService;
  let registerRepo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let movementRepo: { findAndCount: jest.Mock };
  let auditService: { record: jest.Mock };
  let dataSource: { transaction: jest.Mock };
  let manager: {
    findOne: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
  };

  const actor = { id: 1, email: 'a@x.com', fullName: 'A', role: 'SELLER' };
  const req = { ip: '127.0.0.1', headers: {} } as never;

  beforeEach(async () => {
    registerRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((d) => d),
      save: jest.fn((d) => Promise.resolve({ id: 1, ...d })),
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
        CashRegisterService,
        { provide: getRepositoryToken(CashRegister), useValue: registerRepo },
        { provide: getRepositoryToken(CashMovement), useValue: movementRepo },
        { provide: AuditService, useValue: auditService },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get(CashRegisterService);
  });

  afterEach(() => jest.clearAllMocks());

  it('getOpenRegister busca la caja abierta del operador', async () => {
    await service.getOpenRegister(1);

    expect(registerRepo.findOne).toHaveBeenCalledWith({
      where: { openedBy: 1, status: 'OPEN' },
    });
  });

  it('openRegister abre la caja con el saldo inicial y audita', async () => {
    const saved = await service.openRegister(
      { initialBalance: 200 },
      actor,
      req,
    );

    expect(saved.status).toBe('OPEN');
    expect(saved.expected).toBe('200.00');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'CASH:OPEN' }),
    );
  });

  it('openRegister rechaza si ya hay una caja abierta', async () => {
    registerRepo.findOne.mockResolvedValue({ id: 1, status: 'OPEN' });

    await expect(
      service.openRegister({ initialBalance: 100 }, actor, req),
    ).rejects.toThrow('Ya tienes una caja abierta');
  });

  it('addMovement rechaza si la caja no está abierta', async () => {
    registerRepo.findOne.mockResolvedValue(null);

    await expect(
      service.addMovement(
        1,
        { movementType: 'INCOME', amount: 50 },
        actor,
        req,
      ),
    ).rejects.toThrow(DomainException);
  });

  it('addMovement suma ingresos al esperado', async () => {
    registerRepo.findOne.mockResolvedValue({ id: 1, status: 'OPEN' });
    manager.findOne.mockResolvedValue({
      id: 1,
      status: 'OPEN',
      expected: '200.00',
    });

    const movement = await service.addMovement(
      1,
      { movementType: 'INCOME', amount: 50, description: 'Venta' },
      actor,
      req,
    );

    expect(movement.movementType).toBe('INCOME');
    expect(manager.save).toHaveBeenCalledWith(
      CashRegister,
      expect.objectContaining({ expected: '250.00' }),
    );
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'CASH:INCOME' }),
    );
  });

  it('closeRegister calcula la diferencia del arqueo', async () => {
    manager.findOne.mockResolvedValue({
      id: 1,
      status: 'OPEN',
      expected: '200.00',
    });

    const closed = await service.closeRegister(
      1,
      { countedAmount: 210.5 },
      actor,
      req,
    );

    expect(closed.status).toBe('CLOSED');
    expect(closed.difference).toBe('10.50');
    expect(closed.closedBy).toBe(1);
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'CASH:CLOSE' }),
    );
  });

  it('closeRegister rechaza cajas ya cerradas', async () => {
    manager.findOne.mockResolvedValue({ id: 1, status: 'CLOSED' });

    await expect(
      service.closeRegister(1, { countedAmount: 100 }, actor, req),
    ).rejects.toThrow('La caja no está abierta o ya fue cerrada');
  });

  it('getMovements pagina con el usuario relacionado', async () => {
    movementRepo.findAndCount.mockResolvedValue([[{ id: 1 }], 1]);

    const result = await service.getMovements(1, 1, 20);

    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
  });
});
