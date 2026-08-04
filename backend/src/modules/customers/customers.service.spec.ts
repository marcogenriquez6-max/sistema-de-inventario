import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CustomersService } from './customers.service';
import { Customer } from './customer.entity';
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

describe('CustomersService', () => {
  let service: CustomersService;
  let customerRepo: {
    createQueryBuilder: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
  };
  let auditService: { record: jest.Mock };

  const actor = { id: 1, email: 'a@x.com', fullName: 'A', role: 'SELLER' };
  const req = { ip: '127.0.0.1', headers: {} } as never;

  beforeEach(async () => {
    customerRepo = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn((d) => Promise.resolve({ id: 3, ...d })),
      create: jest.fn((d) => d),
    };
    auditService = { record: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        { provide: getRepositoryToken(Customer), useValue: customerRepo },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get(CustomersService);
  });

  afterEach(() => jest.clearAllMocks());

  it('findAll pagina y filtra por texto', async () => {
    customerRepo.createQueryBuilder.mockReturnValue(
      mockQb(jest.fn().mockResolvedValue([[{ id: 1, name: 'X' }], 1])),
    );

    const result = await service.findAll({
      page: 1,
      pageSize: 10,
      q: 'taller',
    });

    expect(result.items).toHaveLength(1);
    expect(result.meta.totalItems).toBe(1);
  });

  it('findOne lanza 404 si no existe', async () => {
    customerRepo.findOne.mockResolvedValue(null);

    await expect(service.findOne(9)).rejects.toThrow('Cliente no encontrado');
  });

  it('create autogenera el código CLI-00001 cuando no se envía', async () => {
    customerRepo.createQueryBuilder.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue(null),
    });

    const saved = await service.create({ name: 'Taller López' }, actor, req);

    expect(saved.code).toBe('CLI-00001');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'CUSTOMER:CREATE' }),
    );
  });

  it('create mantiene el código enviado', async () => {
    const saved = await service.create(
      { name: 'X', code: 'C-100' },
      actor,
      req,
    );

    expect(saved.code).toBe('C-100');
  });

  it('create convierte violación de unicidad en 409', async () => {
    customerRepo.createQueryBuilder.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue(null),
    });
    customerRepo.save.mockRejectedValue({ driverError: { code: '23505' } });

    await expect(service.create({ name: 'X' }, actor, req)).rejects.toThrow(
      DomainException,
    );
  });

  it('update modifica y audita', async () => {
    customerRepo.findOne.mockResolvedValue({
      id: 1,
      name: 'Antes',
      code: 'C-1',
    });

    const saved = await service.update(1, { name: 'Después' }, actor, req);

    expect(saved.name).toBe('Después');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'CUSTOMER:UPDATE' }),
    );
  });
});
