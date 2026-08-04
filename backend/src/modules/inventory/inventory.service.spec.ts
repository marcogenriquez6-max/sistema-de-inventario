import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { StockMovement } from './stock-movement.entity';
import { PricingService } from '../pricing/pricing.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DataSource } from 'typeorm';
import { DomainException } from '../../common/domain-exceptions';

describe('InventoryService', () => {
  let service: InventoryService;
  let movementRepo: {
    findAndCount: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let pricingService: {
    getTaxRate: jest.Mock;
    computeSuggestedBasePrice: jest.Mock;
    computeSalePrice: jest.Mock;
  };
  let auditService: { record: jest.Mock };
  let notificationsService: { createForRoles: jest.Mock };
  let dataSource: {
    transaction: jest.Mock;
    getRepository: jest.Mock;
  };
  let manager: { findOne: jest.Mock; save: jest.Mock; create: jest.Mock };

  const actor = {
    id: 1,
    email: 'a@x.com',
    fullName: 'A',
    role: 'INVENTORY_MANAGER',
  };
  const req = { ip: '127.0.0.1', headers: {} } as never;

  let product: {
    id: number;
    sku: string;
    name: string;
    stock: number;
    minStock: number;
    costPrice: string;
    basePrice: string;
  };

  beforeEach(async () => {
    product = {
      id: 1,
      sku: 'FA-001',
      name: 'Filtro',
      stock: 10,
      minStock: 5,
      costPrice: '10.00',
      basePrice: '15.00',
    };
    movementRepo = {
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
      create: jest.fn((d) => d),
      save: jest.fn((d) => Promise.resolve({ id: 5, ...d })),
    };
    pricingService = {
      getTaxRate: jest.fn().mockResolvedValue(16),
      computeSuggestedBasePrice: jest.fn().mockResolvedValue(15),
      computeSalePrice: jest.fn().mockResolvedValue(17.4),
    };
    auditService = { record: jest.fn().mockResolvedValue(undefined) };
    notificationsService = {
      createForRoles: jest.fn().mockResolvedValue(undefined),
    };

    manager = {
      findOne: jest.fn(),
      save: jest.fn((_e, d) => Promise.resolve(d)),
      create: jest.fn((_e, d) => d),
    };
    dataSource = {
      transaction: jest.fn(
        async (cb: (m: typeof manager) => Promise<unknown>) => cb(manager),
      ),
      getRepository: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: getRepositoryToken(StockMovement), useValue: movementRepo },
        { provide: PricingService, useValue: pricingService },
        { provide: AuditService, useValue: auditService },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get(InventoryService);
  });

  afterEach(() => jest.clearAllMocks());

  it('registerPurchase suma stock, actualiza costos y registra movimiento PURCHASE', async () => {
    manager.findOne.mockResolvedValue(product);

    const movements = await service.registerPurchase(
      {
        items: [{ productId: 1, quantity: 5, unitCost: 12 }],
        concept: 'Compra',
      },
      actor,
      req,
    );

    expect(product.stock).toBe(15);
    expect(product.costPrice).toBe('12.00');
    expect(movements).toHaveLength(1);
    expect(movements[0].movementType).toBe('PURCHASE');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'STOCK:PURCHASE' }),
    );
  });

  it('registerPurchase lanza 404 si el producto no existe', async () => {
    manager.findOne.mockResolvedValue(null);

    await expect(
      service.registerPurchase(
        { items: [{ productId: 9, quantity: 1, unitCost: 1 }] },
        actor,
        req,
      ),
    ).rejects.toThrow(DomainException);
  });

  it('registerAdjustment aplica ajuste positivo', async () => {
    manager.findOne.mockResolvedValue(product);

    const movement = await service.registerAdjustment(
      {
        productId: 1,
        movementType: 'ADJUST',
        quantity: 2,
        concept: 'Sobrante',
      },
      actor,
      req,
    );

    expect(product.stock).toBe(12);
    expect(movement.quantity).toBe(2);
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'STOCK:ADJUST' }),
    );
  });

  it('registerAdjustment rechaza dejar stock negativo', async () => {
    manager.findOne.mockResolvedValue(product);

    await expect(
      service.registerAdjustment(
        {
          productId: 1,
          movementType: 'MERMA',
          quantity: -50,
          concept: 'Merma',
        },
        actor,
        req,
      ),
    ).rejects.toThrow('Stock insuficiente');
  });

  it('registerAdjustment notifica bajo stock tras una salida', async () => {
    manager.findOne.mockResolvedValue({ ...product, stock: 5 });
    dataSource.getRepository.mockReturnValue({
      findOneBy: jest.fn().mockResolvedValue({ ...product, stock: 3 }),
    });

    await service.registerAdjustment(
      { productId: 1, movementType: 'MERMA', quantity: -2, concept: 'Merma' },
      actor,
      req,
    );

    expect(notificationsService.createForRoles).toHaveBeenCalledWith(
      ['INVENTORY_MANAGER', 'ADMIN'],
      'LOW_STOCK',
      expect.any(String),
      expect.any(String),
      expect.any(Object),
    );
  });

  it('getKardex pagina los movimientos de un producto', async () => {
    movementRepo.findAndCount.mockResolvedValue([[{ id: 1 }], 1]);

    const result = await service.getKardex(1, 1, 10);

    expect(result.items).toHaveLength(1);
    expect(result.meta.totalItems).toBe(1);
    expect(movementRepo.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ where: { productId: 1 } }),
    );
  });
});
