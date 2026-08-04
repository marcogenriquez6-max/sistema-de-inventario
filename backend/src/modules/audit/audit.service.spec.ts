import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditService } from './audit.service';
import { AuditLog } from './audit-log.entity';

function mockQb(getManyAndCount: jest.Mock): Record<string, jest.Mock> {
  const qb: Record<string, jest.Mock> = {};
  for (const m of [
    'leftJoinAndSelect',
    'skip',
    'take',
    'orderBy',
    'andWhere',
  ]) {
    qb[m] = jest.fn().mockReturnThis();
  }
  qb.getManyAndCount = getManyAndCount;
  return qb;
}

describe('AuditService', () => {
  let service: AuditService;
  let repo: {
    create: jest.Mock;
    save: jest.Mock;
    createQueryBuilder: jest.Mock;
  };

  const req = {
    ip: '127.0.0.1',
    headers: { 'user-agent': 'jest-agent' },
  } as never;

  beforeEach(async () => {
    repo = {
      create: jest.fn((d) => d),
      save: jest.fn().mockResolvedValue({}),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: getRepositoryToken(AuditLog), useValue: repo },
      ],
    }).compile();

    service = module.get(AuditService);
  });

  afterEach(() => jest.clearAllMocks());

  it('record persiste una entrada con ip y user-agent', async () => {
    await service.record({
      userId: 1,
      action: 'PRODUCT:CREATE',
      resourceType: 'products',
      resourceId: 42,
      metadata: { sku: 'FA-001' },
      request: req,
    });

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1,
        action: 'PRODUCT:CREATE',
        resourceType: 'products',
        resourceId: '42',
        metadata: { sku: 'FA-001' },
        ip: '127.0.0.1',
        userAgent: 'jest-agent',
      }),
    );
  });

  it('record no rompe la operación si la persistencia falla', async () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    repo.save.mockRejectedValue(new Error('DB caída'));

    await expect(
      service.record({
        userId: null,
        action: 'X',
        resourceType: 'x',
      }),
    ).resolves.toBeUndefined();

    expect(consoleError).toHaveBeenCalledWith(
      'Audit persistence failed:',
      'DB caída',
    );
    consoleError.mockRestore();
  });

  it('record normaliza resourceId nulo a null', async () => {
    await service.record({
      userId: null,
      action: 'X',
      resourceType: 'x',
      resourceId: null,
    });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ resourceId: null, metadata: null }),
    );
  });

  it('findAll pagina y filtra por userId, action y resourceType', async () => {
    repo.createQueryBuilder.mockReturnValue(
      mockQb(jest.fn().mockResolvedValue([[{ id: 1 }], 1])),
    );

    const result = await service.findAll({
      page: 2,
      pageSize: 10,
      userId: 3,
      action: 'LOGIN',
      resourceType: 'auth',
    });

    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('findAll omite filtros vacíos', async () => {
    const qb = mockQb(jest.fn().mockResolvedValue([[], 0]));
    repo.createQueryBuilder.mockReturnValue(qb);

    await service.findAll({ page: 1, pageSize: 20 });

    expect(qb.andWhere).not.toHaveBeenCalled();
  });
});
