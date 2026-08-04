import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { SearchService } from './search.service';

describe('SearchService', () => {
  let service: SearchService;
  let dataSource: { query: jest.Mock };

  const empty = () => ({
    products: [],
    customers: [],
    suppliers: [],
    employees: [],
    sales: [],
  });

  beforeEach(async () => {
    dataSource = { query: jest.fn().mockResolvedValue([]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [SearchService, { provide: DataSource, useValue: dataSource }],
    }).compile();

    service = module.get(SearchService);
  });

  afterEach(() => jest.clearAllMocks());

  it('devuelve resultados vacíos para un término en blanco', async () => {
    await expect(service.search('   ')).resolves.toEqual(empty());
    expect(dataSource.query).not.toHaveBeenCalled();
  });

  it('consulta las cinco entidades con un patrón ILIKE escapado', async () => {
    dataSource.query
      .mockResolvedValueOnce([{ id: 1, sku: 'FA-001' }])
      .mockResolvedValueOnce([{ id: 2, name: 'Taller' }])
      .mockResolvedValueOnce([{ id: 3, name: 'Proveedor' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await service.search('filtro', 5);

    expect(dataSource.query).toHaveBeenCalledTimes(5);
    expect(result.products).toHaveLength(1);
    expect(result.customers).toHaveLength(1);
    expect(result.suppliers).toHaveLength(1);
    expect(result.employees).toEqual([]);
    expect(result.sales).toEqual([]);
  });

  it('escapa comodines SQL del término de búsqueda', async () => {
    await service.search('100%_x');

    for (const [, params] of dataSource.query.mock.calls) {
      expect(params).toEqual(['%100\\%\\_x%']);
    }
  });

  it('aplica el límite de resultados a cada consulta', async () => {
    await service.search('aceite', 8);

    for (const [sql] of dataSource.query.mock.calls) {
      expect(sql).toContain('LIMIT 8');
    }
  });
});
