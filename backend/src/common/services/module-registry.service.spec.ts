import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ModuleRegistryService } from './module-registry.service';

describe('ModuleRegistryService', () => {
  let service: ModuleRegistryService;
  let configService: ConfigService;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ModuleRegistryService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get<ModuleRegistryService>(ModuleRegistryService);
    configService = moduleRef.get<ConfigService>(ConfigService);
  });

  it('returns enabled modules and keeps auth/users active', () => {
    jest.spyOn(configService, 'get').mockReturnValue('catalog,inventory,purchases');

    const modules = service.getModules();

    expect(modules.find((m) => m.slug === 'auth')?.enabled).toBe(true);
    expect(modules.find((m) => m.slug === 'users')?.enabled).toBe(true);
    expect(modules.find((m) => m.slug === 'catalog')?.enabled).toBe(true);
    expect(modules.find((m) => m.slug === 'pricing')?.enabled).toBe(false);
    expect(service.getEnabledCount()).toBeGreaterThan(0);
  });

  it('returns all modules disabled when no configuration is present except auth and users', () => {
    jest.spyOn(configService, 'get').mockReturnValue(undefined);

    const modules = service.getModules();
    const enabled = modules.filter((module) => module.enabled);

    expect(enabled.map((module) => module.slug)).toEqual(expect.arrayContaining(['auth', 'users']));
    expect(enabled.length).toBe(2);
    expect(service.getEnabledCount()).toBe(2);
  });
});
