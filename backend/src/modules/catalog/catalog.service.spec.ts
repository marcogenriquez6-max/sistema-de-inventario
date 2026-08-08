import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CatalogService } from './catalog.service';
import { Product } from './product.entity';
import { ProductCode } from './product-code.entity';
import { PricingService } from '../pricing/pricing.service';
import { AuditService } from '../audit/audit.service';
import { DataSource } from 'typeorm';
import { DomainException } from '../../common/domain-exceptions';

function mockQueryBuilder(getManyAndCount: jest.Mock) {
  const qb: Record<string, jest.Mock> = {};
  const chain = ['orderBy', 'andWhere', 'innerJoin', 'skip', 'take', 'getMany'];
  for (const m of chain) {
    qb[m] = jest.fn().mockReturnThis();
  }
  qb.getManyAndCount = getManyAndCount;
  return qb as never;
}

describe('CatalogService', () => {
  let service: CatalogService;
  let productRepo: {
    findOne: jest.Mock;
    find: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
    remove: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let codeRepo: { findOne: jest.Mock };
  let pricingService: {
    computeSuggestedBasePrice: jest.Mock;
    computeSalePrice: jest.Mock;
    getTaxRate: jest.Mock;
  };
  let auditService: { record: jest.Mock };
  let dataSource: {
    manager: { create: jest.Mock; delete: jest.Mock };
    createQueryBuilder: jest.Mock;
  };

  const actor = { id: 1, email: 'a@x.com', fullName: 'A', role: 'ADMIN' };
  const req = { ip: '127.0.0.1', headers: {} } as never;
  const product = {
    id: 1,
    sku: 'FA-001',
    oemCode: null,
    name: 'Filtro',
    stock: 5,
    basePrice: '15.00',
    salePrice: '17.40',
  };

  beforeEach(async () => {
    productRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn((d) => Promise.resolve(d)),
      create: jest.fn((d) => d),
      remove: jest.fn().mockResolvedValue(undefined),
      createQueryBuilder: jest.fn(),
    };
    codeRepo = { findOne: jest.fn() };
    pricingService = {
      computeSuggestedBasePrice: jest.fn().mockResolvedValue(15),
      computeSalePrice: jest.fn().mockResolvedValue(17.4),
      getTaxRate: jest.fn().mockResolvedValue(16),
    };
    auditService = { record: jest.fn().mockResolvedValue(undefined) };
    dataSource = {
      manager: {
        create: jest.fn((_e, d) => d),
        delete: jest.fn().mockResolvedValue({}),
      },
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogService,
        { provide: getRepositoryToken(Product), useValue: productRepo },
        { provide: getRepositoryToken(ProductCode), useValue: codeRepo },
        { provide: PricingService, useValue: pricingService },
        { provide: AuditService, useValue: auditService },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get(CatalogService);
  });

  afterEach(() => jest.clearAllMocks());

  it('findByCode busca por SKU/OEM/código de barras', async () => {
    productRepo.findOne.mockResolvedValue(product);

    await expect(service.findByCode('FA-001')).resolves.toEqual(product);
    expect(productRepo.findOne).toHaveBeenCalledWith({
      where: [{ sku: 'FA-001' }, { oemCode: 'FA-001' }],
    });
  });

  it('findByCode cae en códigos alternativos si no hay match directo', async () => {
    productRepo.findOne.mockResolvedValue(null);
    codeRepo.findOne.mockResolvedValue({ product });

    await expect(service.findByCode('oem-x')).resolves.toEqual(product);
  });

  it('findAll pagina con filtros', async () => {
    productRepo.createQueryBuilder.mockReturnValue(
      mockQueryBuilder(jest.fn().mockResolvedValue([[product], 1])),
    );

    const result = await service.findAll({
      page: 1,
      pageSize: 10,
      q: 'filtro',
    });

    expect(result.items).toHaveLength(1);
    expect(result.meta.totalItems).toBe(1);
  });

  it('findOne lanza 404 si no existe', async () => {
    productRepo.findOne.mockResolvedValue(null);

    await expect(service.findOne(9)).rejects.toThrow('Repuesto no encontrado');
  });

  it('create calcula base sugerida y PVP con IVA', async () => {
    productRepo.save.mockImplementation((d) =>
      Promise.resolve({ id: 7, ...d }),
    );

    const saved = await service.create(
      {
        sku: 'NEW-1',
        name: 'Nuevo',
        costPrice: 10,
        stock: 0,
        unit: 'uds',
        minStock: 0,
      },
      actor,
      req,
    );

    expect(pricingService.computeSuggestedBasePrice).toHaveBeenCalledWith(10);
    expect(saved.id).toBe(7);
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PRODUCT:CREATE' }),
    );
  });

  it('create convierte una violación de unicidad en 409', async () => {
    productRepo.save.mockRejectedValue({ driverError: { code: '23505' } });

    await expect(
      service.create(
        { sku: 'FA-001', name: 'Duplicado', costPrice: 10 },
        actor,
        req,
      ),
    ).rejects.toThrow(DomainException);
  });

  it('create respeta salePrice e imageUrl enviados por el frontend', async () => {
    productRepo.save.mockImplementation((d) =>
      Promise.resolve({ id: 8, ...d }),
    );

    const saved = await service.create(
      {
        sku: 'FOTO-1',
        name: 'Con foto',
        costPrice: 10,
        basePrice: 18,
        salePrice: 22,
        imageUrl: '/api/uploads/foto.jpg',
      },
      actor,
      req,
    );

    expect(saved.salePrice).toBe('22.00');
    expect(saved.imageUrl).toBe('/api/uploads/foto.jpg');
  });

  it('update guarda imageUrl enviada y respeta salePrice explícito', async () => {
    productRepo.findOne.mockResolvedValue({ ...product, imageUrl: null });
    productRepo.save.mockImplementation((d) => Promise.resolve(d));

    const result = await service.update(
      1,
      { salePrice: 25, imageUrl: '/api/uploads/nueva.jpg' },
      actor,
      req,
    );

    expect(result.salePrice).toBe('25.00');
    expect(result.imageUrl).toBe('/api/uploads/nueva.jpg');
  });

  it('update permite limpiar la foto enviando imageUrl null', async () => {
    productRepo.findOne.mockResolvedValue({
      ...product,
      imageUrl: '/api/uploads/old.jpg',
    });
    productRepo.save.mockImplementation((d) => Promise.resolve(d));

    const result = await service.update(
      1,
      { imageUrl: null as never },
      actor,
      req,
    );

    expect(result.imageUrl).toBeNull();
  });

  it('update recalcula precios cuando cambia el costo', async () => {
    productRepo.findOne.mockResolvedValue({ ...product });
    pricingService.computeSalePrice.mockResolvedValue(20.88);

    const result = await service.update(1, { costPrice: 12 }, actor, req);

    expect(result.salePrice).toBe('20.88');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PRODUCT:UPDATE' }),
    );
  });

  it('remove elimina la ficha y audita', async () => {
    productRepo.findOne.mockResolvedValue(product);

    await service.remove(1, actor, req);

    expect(productRepo.remove).toHaveBeenCalledWith(product);
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PRODUCT:DELETE' }),
    );
  });

  it('recalculateSalePrices no hace nada con lista vacía', async () => {
    await expect(service.recalculateSalePrices([])).resolves.toBe(0);
  });

  it('recalculateSalePrices recalcula y guarda', async () => {
    productRepo.find.mockResolvedValue([{ ...product, basePrice: '15.00' }]);

    await expect(service.recalculateSalePrices([1])).resolves.toBe(1);
    expect(productRepo.save).toHaveBeenCalled();
  });

  it('getImportTemplate no incluye columnas de barcode/ubicaciones', () => {
    const csv = service.getImportTemplate();
    expect(csv).toContain('SKU');
    expect(csv).toContain('OEM_CODE');
    expect(csv).toContain('PVP_BASE');
    expect(csv).not.toContain('BARCODE');
    expect(csv).not.toContain('PASILLO');
    expect(csv).not.toContain('ESTANTE');
    expect(csv).not.toContain('NIVEL');
    expect(csv).not.toContain('CASILLA');
  });

  it('importProducts ignora columnas eliminadas (barcode/ubicaciones)', async () => {
    const csv = [
      'SKU,NOMBRE,OEM_CODE,BARCODE,CATEGORIA,MARCA,PROCEDENCIA,UNIDAD,STOCK,STOCK_MINIMO,COSTO,PVP_BASE,PASILLO,ESTANTE,NIVEL,CASILLA',
      'FA-1,Filtro,15560-PLM,P12345,Filtros,Honda,Importado,uds,10,2,12.50,18.75,A,1,2,3',
    ].join('\n');
    productRepo.findOne.mockResolvedValue(null);
    productRepo.create.mockImplementation((d) => d);
    productRepo.save.mockImplementation((d) => Promise.resolve({ id: 1, ...d }));

    const result = await service.importProducts(
      Buffer.from(csv, 'utf-8'),
      'test.csv',
      actor,
      req,
    );

    expect(result.created).toBe(1);
    expect(result.errors).toHaveLength(0);
    const created = productRepo.create.mock.calls[0][0];
    expect(created).toMatchObject({
      sku: 'FA-1',
      name: 'Filtro',
      oemCode: '15560-PLM',
      stock: 10,
      minStock: 2,
    });
    expect(created).not.toHaveProperty('barcode');
    expect(created).not.toHaveProperty('warehouseAisle');
    expect(created).not.toHaveProperty('warehouseShelf');
    expect(created).not.toHaveProperty('warehouseLevel');
    expect(created).not.toHaveProperty('warehouseBin');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PRODUCT:IMPORT' }),
    );
  });

  it('importProducts actualiza productos existentes por SKU', async () => {
    const csv = [
      'SKU,NOMBRE,COSTO,PVP_BASE',
      'FA-001,Filtro Renovado,15.00,22.00',
    ].join('\n');
    productRepo.findOne.mockResolvedValue({ ...product });
    productRepo.save.mockImplementation((d) => Promise.resolve(d));

    const result = await service.importProducts(
      Buffer.from(csv, 'utf-8'),
      'test.csv',
      actor,
      req,
    );

    expect(result.updated).toBe(1);
    expect(productRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ sku: 'FA-001', name: 'Filtro Renovado' }),
    );
  });
});
