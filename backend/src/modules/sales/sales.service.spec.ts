import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SalesService } from './sales.service';
import { SaleDocument } from './sale-document.entity';
import { SaleItem } from './sale-item.entity';
import { PricingService } from '../pricing/pricing.service';
import { SettingsService } from '../settings/settings.service';
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

describe('SalesService', () => {
  let service: SalesService;
  let documentRepo: {
    findOne: jest.Mock;
    createQueryBuilder: jest.Mock;
    save: jest.Mock;
  };
  let itemRepo: Record<string, jest.Mock>;
  let pricingService: {
    getTaxRate: jest.Mock;
    round: jest.Mock;
  };
  let settingsService: {
    get: jest.Mock;
    set: jest.Mock;
  };
  let auditService: { record: jest.Mock };
  let notificationsService: { createForRoles: jest.Mock };
  let dataSource: { transaction: jest.Mock };
  let manager: {
    createQueryBuilder: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  const actor = { id: 1, email: 'a@x.com', fullName: 'A', role: 'ADMIN' };
  const req = { ip: '127.0.0.1', headers: {} } as never;

  const product = {
    id: 1,
    sku: 'FA-001',
    name: 'Filtro de Aceite',
    isActive: true,
    stock: 20,
    basePrice: '15.00',
    salePrice: '17.40',
    costPrice: '10.00',
  };

  const dto = {
    docType: 'NOTA',
    customerName: 'Juan Pérez',
    customerDoc: '12345678',
    items: [{ productId: 1, quantity: 3 }],
  } as never;

  beforeEach(async () => {
    documentRepo = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
      save: jest.fn((d) => Promise.resolve(d)),
    };
    itemRepo = {};
    pricingService = {
      getTaxRate: jest.fn().mockResolvedValue(16),
      round: jest.fn((n: number) => Math.round(n * 100) / 100),
    };
    settingsService = {
      get: jest.fn().mockResolvedValue({ value: { nota: 1, factura: 1 } }),
      set: jest.fn().mockResolvedValue({}),
    };
    auditService = { record: jest.fn().mockResolvedValue(undefined) };
    notificationsService = {
      createForRoles: jest.fn().mockResolvedValue(undefined),
    };

    manager = {
      createQueryBuilder: jest.fn(),
      create: jest.fn((_e, d) => d),
      save: jest.fn((_e, d) => Promise.resolve(d)),
    };
    dataSource = {
      transaction: jest.fn(
        async (cb: (m: typeof manager) => Promise<unknown>) => cb(manager),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        { provide: getRepositoryToken(SaleDocument), useValue: documentRepo },
        { provide: getRepositoryToken(SaleItem), useValue: itemRepo },
        { provide: PricingService, useValue: pricingService },
        { provide: SettingsService, useValue: settingsService },
        { provide: AuditService, useValue: auditService },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get(SalesService);
  });

  afterEach(() => jest.clearAllMocks());

  function mockLockedProducts(products: Array<typeof product>) {
    const qb = {
      where: jest.fn().mockReturnThis(),
      setLock: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(products),
    };
    manager.createQueryBuilder.mockReturnValue(qb);
    return qb;
  }

  describe('createSale', () => {
    it('crea la venta atómicamente: congela precios, descuenta stock y audita', async () => {
      mockLockedProducts([product]);

      const result = await service.createSale(dto, actor, req);

      expect(result.document.docNumber).toBe('NOT-00001');
      expect(result.document.total).toBe('45.00');
      expect(result.document.taxAmount).toBe('0.00');
      expect(product.stock).toBe(17);
      expect(manager.save).toHaveBeenCalled();
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'SALE:CREATE' }),
      );
      expect(notificationsService.createForRoles).toHaveBeenCalledWith(
        ['ADMIN', 'MANAGER'],
        'SALE',
        expect.stringContaining('Nueva venta'),
        expect.any(String),
        expect.any(Object),
      );
    });

    it('cobra IVA cuando el documento es FACTURA', async () => {
      mockLockedProducts([product]);

      const result = await service.createSale(
        { ...(dto as Record<string, unknown>), docType: 'FACTURA' } as never,
        actor,
        req,
      );

      expect(result.document.docNumber).toBe('FAC-00001');
      expect(result.document.subtotal).toBe('45.00');
      expect(result.document.taxAmount).toBe('7.20');
      expect(result.document.total).toBe('52.20');
    });

    it('lanza 404 si un producto no existe', async () => {
      mockLockedProducts([]);

      await expect(service.createSale(dto, actor, req)).rejects.toThrow(
        DomainException,
      );
    });

    it('lanza 409 si el stock no alcanza', async () => {
      mockLockedProducts([{ ...product, stock: 2 }]);

      await expect(service.createSale(dto, actor, req)).rejects.toThrow(
        'Stock insuficiente',
      );
    });

    it('lanza 409 si el producto está inactivo', async () => {
      mockLockedProducts([{ ...product, isActive: false }]);

      await expect(service.createSale(dto, actor, req)).rejects.toThrow(
        'está inactivo',
      );
    });
  });

  describe('consultas', () => {
    it('findAll pagina los documentos', async () => {
      documentRepo.createQueryBuilder.mockReturnValue(
        mockQb(jest.fn().mockResolvedValue([[{ id: 1 }], 1])),
      );

      const result = await service.findAll({ page: 1, pageSize: 10 });

      expect(result.items).toHaveLength(1);
      expect(result.meta.totalItems).toBe(1);
    });

    it('findOne lanza 404 si no existe', async () => {
      documentRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(9)).rejects.toThrow(
        'Documento de venta no encontrado',
      );
    });
  });

  describe('pdfInvoice', () => {
    it('genera un buffer PDF con los datos del documento', async () => {
      documentRepo.findOne.mockResolvedValue({
        id: 1,
        docNumber: 'NOT-00001',
        docType: 'NOTA',
        customerName: 'Juan',
        customerDoc: '123',
        subtotal: '45.00',
        taxRate: '16.00',
        taxAmount: '7.20',
        total: '52.20',
        createdAt: new Date(),
        user: { fullName: 'Admin' },
        items: [
          {
            productSku: 'FA-001',
            productName: 'Filtro',
            quantity: 3,
            unitSale: '17.40',
            lineTotal: '52.20',
          },
        ],
      });
      settingsService.get.mockResolvedValue({ value: 'Distribuidora X' });

      const buffer = await service.pdfInvoice(1);

      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });

  describe('voidDocument', () => {
    it('anula el documento y audita', async () => {
      documentRepo.findOne.mockResolvedValue({
        id: 1,
        docNumber: 'NOT-00001',
        status: 'COMPLETED',
      });

      const result = await service.voidDocument(
        1,
        'error de captura',
        actor,
        req,
      );

      expect(result.status).toBe('VOIDED');
      expect(result.voidReason).toBe('error de captura');
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'SALE:VOID' }),
      );
    });

    it('rechaza anular un documento ya anulado', async () => {
      documentRepo.findOne.mockResolvedValue({
        id: 1,
        status: 'VOIDED',
      });

      await expect(service.voidDocument(1, 'x', actor, req)).rejects.toThrow(
        'ya está anulado',
      );
    });
  });
});
