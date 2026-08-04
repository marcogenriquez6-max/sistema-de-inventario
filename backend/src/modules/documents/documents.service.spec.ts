import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DocumentsService } from './documents.service';
import { DocumentRecord } from './document.entity';
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

describe('DocumentsService', () => {
  let service: DocumentsService;
  let docRepo: {
    createQueryBuilder: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };
  let auditService: { record: jest.Mock };

  const actor = { id: 1, email: 'a@x.com', fullName: 'A', role: 'ADMIN' };
  const req = { ip: '127.0.0.1', headers: {} } as never;
  const doc = { id: 1, name: 'factura.pdf', category: 'Compras' };

  beforeEach(async () => {
    docRepo = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((d) => d),
      save: jest.fn((d) => Promise.resolve({ id: 1, ...d })),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    auditService = { record: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: getRepositoryToken(DocumentRecord), useValue: docRepo },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get(DocumentsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('findAll pagina y filtra por categoría', async () => {
    docRepo.createQueryBuilder.mockReturnValue(
      mockQb(jest.fn().mockResolvedValue([[doc], 1])),
    );

    const result = await service.findAll({
      page: 1,
      pageSize: 10,
      category: 'Compras',
    });

    expect(result.items).toHaveLength(1);
    expect(result.meta.totalItems).toBe(1);
  });

  it('findOne lanza 404 si no existe', async () => {
    docRepo.findOne.mockResolvedValue(null);

    await expect(service.findOne(9)).rejects.toThrow('Documento no encontrado');
  });

  it('create guarda el documento con uploadedBy y audita', async () => {
    await service.create({ name: 'factura.pdf', referenceId: 12 }, actor, req);

    expect(docRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ uploadedBy: 1, referenceId: '12' }),
    );
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'DOCUMENT:CREATE' }),
    );
  });

  it('create deja referenceId null cuando no viene', async () => {
    await service.create({ name: 'manual.pdf' }, actor, req);

    expect(docRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ referenceId: null }),
    );
  });

  it('remove elimina el documento y audita', async () => {
    docRepo.findOne.mockResolvedValue(doc);

    await service.remove(1, actor, req);

    expect(docRepo.remove).toHaveBeenCalledWith(doc);
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'DOCUMENT:DELETE' }),
    );
  });

  it('remove lanza 404 si no existe', async () => {
    docRepo.findOne.mockResolvedValue(null);

    await expect(service.remove(9, actor, req)).rejects.toThrow(
      DomainException,
    );
  });
});
