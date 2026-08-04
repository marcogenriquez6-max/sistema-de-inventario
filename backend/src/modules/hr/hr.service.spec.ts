import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HrService } from './hr.service';
import { Employee } from './employee.entity';
import { AuditService } from '../audit/audit.service';
import { DomainException } from '../../common/domain-exceptions';

function mockQb(getManyAndCount: jest.Mock): Record<string, jest.Mock> {
  const qb: Record<string, jest.Mock> = {};
  for (const m of ['orderBy', 'andWhere', 'skip', 'take']) {
    qb[m] = jest.fn().mockReturnThis();
  }
  qb.getManyAndCount = getManyAndCount;
  return qb;
}

describe('HrService', () => {
  let service: HrService;
  let empRepo: {
    createQueryBuilder: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let auditService: { record: jest.Mock };

  const actor = { id: 1, email: 'a@x.com', fullName: 'A', role: 'ADMIN' };
  const req = { ip: '127.0.0.1', headers: {} } as never;
  const employee = {
    id: 1,
    code: 'EMP-00001',
    fullName: 'Ana Condori',
    department: 'Ventas',
  };

  beforeEach(async () => {
    empRepo = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((d) => d),
      save: jest.fn((d) => Promise.resolve({ id: 1, ...d })),
    };
    auditService = { record: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HrService,
        { provide: getRepositoryToken(Employee), useValue: empRepo },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get(HrService);
  });

  afterEach(() => jest.clearAllMocks());

  it('findAll pagina y filtra por texto y departamento', async () => {
    empRepo.createQueryBuilder.mockReturnValue(
      mockQb(jest.fn().mockResolvedValue([[employee], 1])),
    );

    const result = await service.findAll({
      page: 1,
      pageSize: 10,
      q: 'ana',
      department: 'Ventas',
    });

    expect(result.items).toHaveLength(1);
    expect(result.meta.totalItems).toBe(1);
    expect(result.meta.totalPages).toBe(1);
  });

  it('findOne lanza DomainException 404 si no existe', async () => {
    empRepo.findOne.mockResolvedValue(null);

    await expect(service.findOne(9)).rejects.toThrow('Empleado no encontrado');
  });

  it('create guarda el empleado y audita', async () => {
    const saved = await service.create(
      { code: 'EMP-00001', fullName: 'Ana Condori' },
      actor,
      req,
    );

    expect(saved.code).toBe('EMP-00001');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'EMPLOYEE:CREATE' }),
    );
  });

  it('create convierte violación de unicidad en 409', async () => {
    empRepo.save.mockRejectedValue({ driverError: { code: '23505' } });

    await expect(
      service.create({ code: 'EMP-00001', fullName: 'X' }, actor, req),
    ).rejects.toThrow(DomainException);
  });

  it('update aplica cambios y audita', async () => {
    empRepo.findOne.mockResolvedValue(employee);
    empRepo.save.mockImplementation((d) => Promise.resolve({ ...d }));

    const saved = await service.update(
      1,
      { position: 'Jefa de Ventas' },
      actor,
      req,
    );

    expect(saved.position).toBe('Jefa de Ventas');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'EMPLOYEE:UPDATE' }),
    );
  });

  it('update lanza 404 si el empleado no existe', async () => {
    empRepo.findOne.mockResolvedValue(null);

    await expect(
      service.update(9, { position: 'X' }, actor, req),
    ).rejects.toThrow('Empleado no encontrado');
  });
});
