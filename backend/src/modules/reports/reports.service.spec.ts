import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ReportsService } from './reports.service';
import { SaleDocument } from '../sales/sale-document.entity';
import { Product } from '../catalog/product.entity';

function mockQb(
  getRawOne: jest.Mock | undefined,
  getCount: jest.Mock | undefined,
  getManyAndCount: jest.Mock | undefined,
) {
  const qb: Record<string, jest.Mock> = {};
  for (const m of [
    'select',
    'addSelect',
    'where',
    'andWhere',
    'skip',
    'take',
    'orderBy',
    'groupBy',
    'addGroupBy',
    'from',
    'innerJoin',
  ]) {
    qb[m] = jest.fn().mockReturnThis();
  }
  if (getRawOne) qb.getRawOne = getRawOne;
  if (getCount) qb.getCount = getCount;
  if (getManyAndCount) qb.getManyAndCount = getManyAndCount;
  return qb as never;
}

describe('ReportsService', () => {
  let service: ReportsService;
  let saleRepo: {
    createQueryBuilder: jest.Mock;
    find: jest.Mock;
  };
  let productRepo: {
    createQueryBuilder: jest.Mock;
    find: jest.Mock;
  };
  let dataSource: { createQueryBuilder: jest.Mock };

  const product = {
    id: 1,
    sku: 'FA-001',
    name: 'Filtro',
    stock: 2,
    minStock: 5,
    salePrice: '17.40',
  };

  beforeEach(async () => {
    saleRepo = {
      createQueryBuilder: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
    };
    productRepo = {
      createQueryBuilder: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
    };
    dataSource = { createQueryBuilder: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: getRepositoryToken(SaleDocument), useValue: saleRepo },
        { provide: getRepositoryToken(Product), useValue: productRepo },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get(ReportsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('dashboard agrega ventas del día y del mes', async () => {
    const today = jest.fn().mockResolvedValue({ count: '2', total: '34.80' });
    const month = jest.fn().mockResolvedValue({ count: '10', total: '200' });
    saleRepo.createQueryBuilder.mockReturnValueOnce(
      mockQb(today, undefined, undefined),
    );
    saleRepo.createQueryBuilder.mockReturnValueOnce(
      mockQb(month, undefined, undefined),
    );
    productRepo.createQueryBuilder
      .mockReturnValueOnce(
        mockQb(undefined, jest.fn().mockResolvedValue(3), undefined),
      )
      .mockReturnValueOnce(
        mockQb(undefined, jest.fn().mockResolvedValue(50), undefined),
      )
      .mockReturnValueOnce(
        mockQb(
          jest.fn().mockResolvedValue({ value: '1000' }),
          undefined,
          undefined,
        ),
      );
    productRepo.find.mockResolvedValue([product]);
    saleRepo.find.mockResolvedValue([
      {
        id: 1,
        docNumber: 'FAC-1',
        docType: 'FACTURA',
        total: '17.40',
        customerName: 'Juan',
        createdAt: new Date(),
      },
    ]);

    const result = await service.dashboard();

    expect(result.todaySales).toEqual({ count: 2, total: 34.8 });
    expect(result.monthSales).toEqual({ count: 10, total: 200 });
    expect(result.lowStockCount).toBe(3);
    expect(result.totalProducts).toBe(50);
    expect(result.totalStockValue).toBe(1000);
    expect(result.lowStockProducts).toEqual([
      expect.objectContaining({ sku: 'FA-001', stock: 2, minStock: 5 }),
    ]);
    expect(result.recentSales).toHaveLength(1);
  });

  it('dashboard tolera valores nulos de los agregados', async () => {
    saleRepo.createQueryBuilder
      .mockReturnValueOnce(
        mockQb(jest.fn().mockResolvedValue(null), undefined, undefined),
      )
      .mockReturnValueOnce(
        mockQb(jest.fn().mockResolvedValue(null), undefined, undefined),
      );
    productRepo.createQueryBuilder
      .mockReturnValueOnce(
        mockQb(undefined, jest.fn().mockResolvedValue(0), undefined),
      )
      .mockReturnValueOnce(
        mockQb(undefined, jest.fn().mockResolvedValue(0), undefined),
      )
      .mockReturnValueOnce(
        mockQb(jest.fn().mockResolvedValue(null), undefined, undefined),
      );

    const result = await service.dashboard();

    expect(result.todaySales).toEqual({ count: 0, total: 0 });
    expect(result.totalStockValue).toBe(0);
    expect(result.lowStockProducts).toEqual([]);
  });

  it('dashboard solo reporta productos realmente bajo stock', async () => {
    saleRepo.createQueryBuilder
      .mockReturnValueOnce(
        mockQb(
          jest.fn().mockResolvedValue({ count: '1', total: '10' }),
          undefined,
          undefined,
        ),
      )
      .mockReturnValueOnce(
        mockQb(
          jest.fn().mockResolvedValue({ count: '2', total: '20' }),
          undefined,
          undefined,
        ),
      );
    productRepo.createQueryBuilder
      .mockReturnValueOnce(
        mockQb(undefined, jest.fn().mockResolvedValue(1), undefined),
      )
      .mockReturnValueOnce(
        mockQb(undefined, jest.fn().mockResolvedValue(2), undefined),
      )
      .mockReturnValueOnce(
        mockQb(
          jest.fn().mockResolvedValue({ value: '5' }),
          undefined,
          undefined,
        ),
      );
    productRepo.find.mockResolvedValue([
      { ...product, stock: 1, minStock: 5 },
      { ...product, id: 2, sku: 'OK-1', stock: 20, minStock: 5 },
    ]);

    const result = await service.dashboard();

    expect(result.lowStockProducts).toHaveLength(1);
    expect(result.lowStockProducts[0].sku).toBe('FA-001');
  });

  it('lowStock pagina los productos críticos', async () => {
    productRepo.createQueryBuilder.mockReturnValue(
      mockQb(undefined, undefined, jest.fn().mockResolvedValue([[product], 1])),
    );

    const result = await service.lowStock(1, 20);

    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('salesByDay devuelve vacío con fechas inválidas o invertidas', async () => {
    await expect(service.salesByDay('no-fecha', '2026-01-01')).resolves.toEqual(
      [],
    );
    await expect(
      service.salesByDay('2026-01-10', '2026-01-01'),
    ).resolves.toEqual([]);
  });

  it('salesByDay agrupa ventas por día', async () => {
    const qb: Record<string, jest.Mock> = {};
    for (const m of [
      'select',
      'addSelect',
      'from',
      'where',
      'andWhere',
      'groupBy',
      'addGroupBy',
      'orderBy',
    ]) {
      qb[m] = jest.fn().mockReturnThis();
    }
    qb.getRawMany = jest
      .fn()
      .mockResolvedValue([{ day: '2026-01-01', total: '100', count: '2' }]);
    dataSource.createQueryBuilder.mockReturnValue(qb as never);

    const result = await service.salesByDay('2026-01-01', '2026-01-31');

    expect(result).toEqual([{ day: '2026-01-01', total: 100, count: 2 }]);
  });
});
