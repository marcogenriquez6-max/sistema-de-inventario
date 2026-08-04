import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PurchasesService } from './purchases.service';
import { PurchaseDocument } from './purchase-document.entity';
import { PurchaseItem } from './purchase-item.entity';
import { PricingService } from '../pricing/pricing.service';
import { SettingsService } from '../settings/settings.service';
import { SuppliersService } from '../suppliers/suppliers.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DataSource } from 'typeorm';
import { DomainException } from '../../common/domain-exceptions';

function mockQb(getManyAndCount: jest.Mock) {
  const qb: Record<string, jest.Mock> = {};
  for (const m of [
    'leftJoinAndSelect',
    'orderBy',
    'andWhere',
    'skip',
    'take',
  ]) {
    qb[m] = jest.fn().mockReturnThis();
  }
  qb.getManyAndCount = getManyAndCount;
  return qb as never;
}

describe('PurchasesService', () => {
  let service: PurchasesService;
  let docRepo: { createQueryBuilder: jest.Mock; findOne: jest.Mock };
  let itemRepo: Record<string, jest.Mock>;
  let pricingService: {
    getTaxRate: jest.Mock;
    computeSuggestedBasePrice: jest.Mock;
    computeSalePrice: jest.Mock;
    round: jest.Mock;
  };
  let settingsService: { get: jest.Mock; set: jest.Mock };
  let suppliersService: { findOne: jest.Mock };
  let auditService: { record: jest.Mock };
  let notificationsService: { createForRoles: jest.Mock };
  let dataSource: { transaction: jest.Mock };
  let manager: {
    createQueryBuilder: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
  };

  const actor = {
    id: 1,
    email: 'a@x.com',
    fullName: 'A',
    role: 'INVENTORY_MANAGER',
  };
  const req = { ip: '127.0.0.1', headers: {} } as never;

  const supplier = { id: 1, name: 'Distribuidora Central' };
  const product = {
    id: 1,
    sku: 'FA-001',
    name: 'Filtro',
    stock: 5,
    basePrice: '15.00',
    salePrice: '17.40',
  };
  const dto = {
    supplierId: 1,
    invoiceNumber: 'F-100',
    items: [{ productId: 1, quantity: 5, unitCost: 12 }],
  } as never;

  beforeEach(async () => {
    docRepo = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
    };
    itemRepo = {};
    pricingService = {
      getTaxRate: jest.fn().mockResolvedValue(16),
      computeSuggestedBasePrice: jest.fn().mockResolvedValue(18),
      computeSalePrice: jest.fn().mockResolvedValue(20.88),
      round: jest.fn((n: number) => Math.round(n * 100) / 100),
    };
    settingsService = {
      get: jest.fn().mockResolvedValue({ value: { purchase: 1 } }),
      set: jest.fn().mockResolvedValue({}),
    };
    suppliersService = { findOne: jest.fn().mockResolvedValue(supplier) };
    auditService = { record: jest.fn().mockResolvedValue(undefined) };
    notificationsService = {
      createForRoles: jest.fn().mockResolvedValue(undefined),
    };

    manager = {
      createQueryBuilder: jest.fn(),
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
        PurchasesService,
        { provide: getRepositoryToken(PurchaseDocument), useValue: docRepo },
        { provide: getRepositoryToken(PurchaseItem), useValue: itemRepo },
        { provide: PricingService, useValue: pricingService },
        { provide: SettingsService, useValue: settingsService },
        { provide: SuppliersService, useValue: suppliersService },
        { provide: AuditService, useValue: auditService },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get(PurchasesService);
  });

  afterEach(() => jest.clearAllMocks());

  it('create registra la compra, ingresa stock y notifica', async () => {
    const qb = {
      where: jest.fn().mockReturnThis(),
      setLock: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([product]),
    };
    manager.createQueryBuilder.mockReturnValue(qb);

    const result = await service.create(dto, actor, req);

    expect(result.docNumber).toBe('COM-00001');
    expect(result.supplierName).toBe('Distribuidora Central');
    expect(product.stock).toBe(10);
    expect(result.total).toBe('69.60');
    expect(notificationsService.createForRoles).toHaveBeenCalled();
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PURCHASE:CREATE' }),
    );
  });

  it('create lanza 404 si el producto no existe', async () => {
    const qb = {
      where: jest.fn().mockReturnThis(),
      setLock: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    manager.createQueryBuilder.mockReturnValue(qb);

    await expect(service.create(dto, actor, req)).rejects.toThrow(
      DomainException,
    );
  });

  it('findAll pagina los documentos', async () => {
    docRepo.createQueryBuilder.mockReturnValue(
      mockQb(jest.fn().mockResolvedValue([[{ id: 1 }], 1])),
    );

    const result = await service.findAll({ page: 1, pageSize: 10 });

    expect(result.items).toHaveLength(1);
    expect(result.meta.totalItems).toBe(1);
  });

  it('findOne lanza 404 si no existe', async () => {
    docRepo.findOne.mockResolvedValue(null);

    await expect(service.findOne(9)).rejects.toThrow(
      'Documento de compra no encontrado',
    );
  });
});
