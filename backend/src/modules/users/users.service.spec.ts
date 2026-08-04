import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { AuditService } from '../audit/audit.service';

jest.mock('argon2', () => ({
  verify: jest.fn(),
  hash: jest.fn(),
}));

const mockedVerify = argon2.verify as jest.Mock;
const mockedHash = argon2.hash as jest.Mock;

function mockQueryBuilder(overrides: Record<string, jest.Mock>) {
  const qb: Record<string, jest.Mock> = {};
  const chain: string[] = [
    'addSelect',
    'where',
    'getOne',
    'andWhere',
    'orderBy',
    'skip',
    'take',
    'getManyAndCount',
  ];
  for (const m of chain) {
    qb[m] = jest.fn().mockReturnThis();
  }
  qb.getOne = overrides.getOne ?? jest.fn().mockResolvedValue(null);
  qb.getManyAndCount =
    overrides.getManyAndCount ?? jest.fn().mockResolvedValue([[], 0]);
  return qb as never;
}

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: {
    findOne: jest.Mock;
    createQueryBuilder: jest.Mock;
    findAndCount: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let auditService: { record: jest.Mock };

  const actor = { id: 1, email: 'admin@x.com', fullName: 'A', role: 'ADMIN' };
  const req = { ip: '127.0.0.1', headers: {} } as never;

  beforeEach(async () => {
    userRepo = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
      create: jest.fn((d) => d),
      save: jest.fn((d) => Promise.resolve({ id: 10, ...d })),
    };
    auditService = { record: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  afterEach(() => jest.clearAllMocks());

  it('findByEmail devuelve el usuario por correo', async () => {
    const u = { id: 1, email: 'a@b.com' };
    userRepo.findOne.mockResolvedValue(u);

    await expect(service.findByEmail('a@b.com')).resolves.toEqual(u);
  });

  it('findByEmailWithPassword incluye el hash mediante query builder', async () => {
    const u = { id: 1, passwordHash: 'h' };
    userRepo.createQueryBuilder.mockReturnValue(
      mockQueryBuilder({ getOne: jest.fn().mockResolvedValue(u) }),
    );

    await expect(service.findByEmailWithPassword('a@b.com')).resolves.toEqual(
      u,
    );
  });

  it('findById lanza 404 si no existe', async () => {
    userRepo.findOne.mockResolvedValue(null);

    await expect(service.findById(99)).rejects.toThrow('Usuario no encontrado');
  });

  it('findAll pagina y aplica filtros', async () => {
    userRepo.findAndCount.mockResolvedValue([[{ id: 1, fullName: 'A' }], 1]);

    const result = await service.findAll({
      page: 1,
      pageSize: 20,
      role: 'ADMIN',
    });

    expect(result.items).toHaveLength(1);
    expect(result.meta.totalItems).toBe(1);
    expect(userRepo.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ where: { role: 'ADMIN' } }),
    );
  });

  it('create rechaza correo duplicado con 409', async () => {
    userRepo.findOne.mockResolvedValue({ id: 1, email: 'a@b.com' });

    await expect(
      service.create(
        { email: 'a@b.com', fullName: 'A', password: 'x', role: 'SELLER' },
        actor,
        req,
      ),
    ).rejects.toThrow('Ya existe un usuario con ese correo');
  });

  it('create guarda el usuario con el hash y audita', async () => {
    userRepo.findOne.mockResolvedValue(null);
    mockedHash.mockResolvedValue('hashed');

    const saved = await service.create(
      { email: 'new@b.com', fullName: 'New', password: 'x', role: 'SELLER' },
      actor,
      req,
    );

    expect(mockedHash).toHaveBeenCalledWith('x');
    expect(saved.id).toBe(10);
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'USER:CREATE' }),
    );
  });

  it('update aplica cambios y rehashea la contraseña si viene', async () => {
    userRepo.findOne.mockResolvedValue({
      id: 1,
      email: 'a@b.com',
      fullName: 'Old',
      passwordHash: 'h',
    });
    mockedHash.mockResolvedValue('new-hash');

    await service.update(
      1,
      { fullName: 'New', password: 'secret' },
      actor,
      req,
    );

    expect(mockedHash).toHaveBeenCalledWith('secret');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'USER:UPDATE' }),
    );
  });

  it('changePassword lanza 401 si la contraseña actual es incorrecta', async () => {
    userRepo.createQueryBuilder.mockReturnValue(
      mockQueryBuilder({
        getOne: jest.fn().mockResolvedValue({ id: 1, passwordHash: 'h' }),
      }),
    );
    mockedVerify.mockResolvedValue(false);

    await expect(service.changePassword(1, 'wrong', 'new')).rejects.toThrow(
      'La contraseña actual es incorrecta',
    );
  });

  it('changePassword actualiza el hash con contraseña correcta', async () => {
    userRepo.createQueryBuilder.mockReturnValue(
      mockQueryBuilder({
        getOne: jest.fn().mockResolvedValue({ id: 1, passwordHash: 'h' }),
      }),
    );
    mockedVerify.mockResolvedValue(true);
    mockedHash.mockResolvedValue('new-hash');

    await service.changePassword(1, 'ok', 'new');

    expect(mockedHash).toHaveBeenCalledWith('new');
    expect(userRepo.save).toHaveBeenCalled();
  });
});
