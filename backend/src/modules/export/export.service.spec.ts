import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ExportService } from './export.service';

describe('ExportService', () => {
  let service: ExportService;
  let dataSource: { query: jest.Mock };

  const productRow = {
    sku: 'FA-001',
    name: 'Filtro, Aceite',
    category: 'Filtros',
    brand: 'Wix',
    stock: 5,
    minStock: 2,
    costPrice: '10.00',
    basePrice: '15.00',
    salePrice: '17.40',
    isActive: true,
  };

  beforeEach(async () => {
    dataSource = { query: jest.fn().mockResolvedValue([productRow]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ExportService, { provide: DataSource, useValue: dataSource }],
    }).compile();

    service = module.get(ExportService);
  });

  afterEach(() => jest.clearAllMocks());

  it('getFormats expone los formatos soportados', () => {
    expect(service.getFormats()).toEqual(['csv', 'xlsx', 'pdf']);
  });

  it('getResourceNames lista los recursos exportables', () => {
    expect(service.getResourceNames()).toEqual(
      expect.arrayContaining([
        'products',
        'inventory',
        'sales',
        'customers',
        'suppliers',
        'purchases',
        'employees',
        'audit',
      ]),
    );
  });

  it('export lanza BadRequest con recurso inválido', async () => {
    await expect(service.export('nope', 'csv', {})).rejects.toThrow(
      BadRequestException,
    );
  });

  it('export lanza BadRequest con formato inválido', async () => {
    await expect(
      service.export('products', 'xml' as never, {}),
    ).rejects.toThrow(BadRequestException);
  });

  it('genera CSV con encabezados y valores escapados', async () => {
    const result = await service.export('products', 'csv', { q: 'filtro' });

    expect(result.mime).toBe('text/csv; charset=utf-8');
    expect(result.extension).toBe('csv');
    const text = result.buffer.toString('utf8');
    expect(text.startsWith('\uFEFF')).toBe(true);
    expect(text).toContain('SKU,Nombre,Categoría');
    expect(text).toContain('"Filtro, Aceite"');
  });

  it('genera XLSX con el mime de spreadsheet', async () => {
    const result = await service.export('products', 'xlsx', {});

    expect(result.extension).toBe('xlsx');
    expect(result.mime).toContain('spreadsheetml');
    expect(result.buffer.length).toBeGreaterThan(0);
  });

  it('genera PDF con el mime de aplicación/pdf', async () => {
    const result = await service.export('products', 'pdf', {});

    expect(result.extension).toBe('pdf');
    expect(result.mime).toBe('application/pdf');
    expect(result.buffer.length).toBeGreaterThan(0);
  });

  it('pasa el patrón de búsqueda a la consulta de productos', async () => {
    await service.export('products', 'csv', { q: 'filtro' });

    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('ILIKE $1'),
      ['%filtro%'],
    );
  });
});
