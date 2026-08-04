import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SuppliersService } from './suppliers.service';
import { Supplier } from './supplier.entity';
import { AuditService } from '../audit/audit.service';
import { DomainException } from '../../common/domain-exceptions';

function mockQb(getManyAndCount: jest.Mock) {
  const qb: Record<string, jest.Mock> = {};
  for (const m of ['orderBy', 'andWhere', 'skip', 'take']) {
    qb[m] = jest.fn().mockReturnThis();
  }
  qb.getManyAndCount = getManyAndCount;
  return qb as never;
}

describe('SuppliersService', () => {
  let service: SuppliersService;
  let supplierRepo: {
    createQueryBuilder: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
  };
  let auditService: { record: jest.Mock };

  const actor = { id: 1, email: 'a@x.com', fullName: 'A', role: 'MANAGER' };
  const req = { ip: '127.0.0.1', headers: {} } as never;

  beforeEach(async () => {
    supplierRepo = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn((d) => Promise.resolve({ id: 2, ...d })),
      create: jest.fn((d) => d),
    };
    auditService = { record: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuppliersService,
        { provide: getRepositoryToken(Supplier), useValue: supplierRepo },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get(SuppliersService);
  });

  afterEach(() => jest.clearAllMocks());

  it('findAll pagina y filtra por texto', async () => {
    supplierRepo.createQueryBuilder.mockReturnValue(
      mockQb(jest.fn().mockResolvedValue([[{ id: 1, name: 'X' }], 1])),
    );

    const result = await service.findAll({
      page: 1,
      pageSize: 10,
      q: 'central',
    });

    expect(result.items).toHaveLength(1);
    expect(result.meta.totalItems).toBe(1);
  });

  it('findOne lanza 404 si no existe', async () => {
    supplierRepo.findOne.mockResolvedValue(null);

    await expect(service.findOne(9)).rejects.toThrow('Proveedor no encontrado');
  });

  it('create guarda y audita', async () => {
    const saved = await service.create(
      { code: 'P-100', name: 'Central' },
      actor,
      req,
    );

    expect(saved.id).toBe(2);
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'SUPPLIER:CREATE' }),
    );
  });

  it('create convierte violación de unicidad en 409', async () => {
    supplierRepo.save.mockRejectedValue({ driverError: { code: '23505' } });

    await expect(
      service.create({ code: 'P-100', name: 'X' }, actor, req),
    ).rejects.toThrow(DomainException);
  });

  it('update modifica y audita', async () => {
    supplierRepo.findOne.mockResolvedValue({
      id: 1,
      name: 'Antes',
      code: 'P-1',
    });

    const saved = await service.update(1, { name: 'Después' }, actor, req);

    expect(saved.name).toBe('Después');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'SUPPLIER:UPDATE' }),
    );
  });
});
