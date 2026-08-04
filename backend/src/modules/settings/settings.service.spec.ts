import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SettingsService } from './settings.service';
import { Setting, SettingHistory } from './settings.entity';
import { DomainException } from '../../common/domain-exceptions';

describe('SettingsService', () => {
  let service: SettingsService;
  let settingRepo: {
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
    findOneOrFail: jest.Mock;
  };
  let historyRepo: {
    save: jest.Mock;
    create: jest.Mock;
    find: jest.Mock;
  };

  beforeEach(async () => {
    settingRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn((d) => Promise.resolve(d)),
      create: jest.fn((d) => d),
      findOneOrFail: jest.fn(({ where }) =>
        Promise.resolve({ key: where.key, value: { value: 0 } }),
      ),
    };
    historyRepo = {
      save: jest.fn((d) => Promise.resolve(d)),
      create: jest.fn((d) => d),
      find: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: getRepositoryToken(Setting), useValue: settingRepo },
        { provide: getRepositoryToken(SettingHistory), useValue: historyRepo },
      ],
    }).compile();

    service = module.get(SettingsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('onApplicationBootstrap precarga la cache', async () => {
    settingRepo.find.mockResolvedValue([
      { key: 'tax_rate', value: { value: 16 } },
    ]);

    await service.onApplicationBootstrap();

    await expect(service.get('tax_rate')).resolves.toEqual({ value: 16 });
  });

  it('get devuelve null si el parámetro no existe', async () => {
    settingRepo.findOne.mockResolvedValue(null);

    await expect(service.get('nada')).resolves.toBeNull();
  });

  it('get hace cache y evita consultas repetidas', async () => {
    settingRepo.findOne.mockResolvedValue({ key: 'x', value: { a: 1 } });

    await service.get('x');
    await service.get('x');

    expect(settingRepo.findOne).toHaveBeenCalledTimes(1);
  });

  it('getTaxRate devuelve el IVA configurado', async () => {
    settingRepo.find.mockResolvedValue([
      { key: 'tax_rate', value: { value: 16 } },
    ]);

    await service.onApplicationBootstrap();

    await expect(service.getTaxRate()).resolves.toBe(16);
  });

  it('getDefaultMarginPct devuelve el margen global', async () => {
    settingRepo.findOne.mockResolvedValue({
      key: 'default_margin_pct',
      value: { value: 50 },
    });

    await expect(service.getDefaultMarginPct()).resolves.toBe(50);
  });

  it('set versiona el valor anterior cuando ya existe', async () => {
    settingRepo.findOne.mockResolvedValue({
      key: 'tax_rate',
      value: { value: 13 },
    });

    await service.set('tax_rate', { value: 16 }, 1);

    expect(historyRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'tax_rate', value: { value: 13 } }),
    );
    expect(settingRepo.save).toHaveBeenCalled();
  });

  it('set crea el parámetro cuando no existe', async () => {
    settingRepo.findOne.mockResolvedValue(null);

    await service.set('company_name', { value: 'X' }, 1);

    expect(historyRepo.save).not.toHaveBeenCalled();
    expect(settingRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'company_name' }),
    );
  });

  it('getSettingOrFail lanza 404 si no está configurado', async () => {
    settingRepo.findOne.mockResolvedValue(null);

    await expect(service.getSettingOrFail('x')).rejects.toThrow(
      DomainException,
    );
  });

  it('getHistory ordena por fecha descendente', async () => {
    historyRepo.find.mockResolvedValue([
      { id: 2, key: 'tax_rate', changedAt: new Date('2026-01-02') },
      { id: 1, key: 'tax_rate', changedAt: new Date('2026-01-01') },
    ]);

    const result = await service.getHistory('tax_rate');

    expect(historyRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ order: { changedAt: 'DESC' } }),
    );
    expect(result).toHaveLength(2);
  });
});
