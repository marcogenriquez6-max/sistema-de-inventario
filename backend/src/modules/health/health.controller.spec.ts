import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { HealthController } from './health.controller';
import { ModuleRegistryService } from '../../common/services/module-registry.service';

describe('HealthController', () => {
  let controller: HealthController;
  let dataSource: DataSource;
  let moduleRegistry: ModuleRegistryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: DataSource,
          useValue: { query: jest.fn().mockResolvedValue([{ result: 1 }]) },
        },
        {
          provide: ModuleRegistryService,
          useValue: {
            getModules: jest.fn().mockReturnValue([
              {
                name: 'Test',
                slug: 'test',
                enabled: true,
                description: 'Test module',
                category: 'core',
              },
            ]),
            getEnabledCount: jest.fn().mockReturnValue(1),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    dataSource = module.get<DataSource>(DataSource);
    moduleRegistry = module.get<ModuleRegistryService>(ModuleRegistryService);
  });

  it('should return liveness information', () => {
    const result = controller.liveness();

    expect(result).toEqual(
      expect.objectContaining({
        status: 'ok',
        timestamp: expect.any(String),
      }),
    );
    expect(result.uptime).toBeGreaterThanOrEqual(0);
  });

  it('should verify database readiness', async () => {
    const result = await controller.readiness();

    expect(dataSource.query).toHaveBeenCalledWith('SELECT 1');
    expect(result).toEqual(
      expect.objectContaining({
        status: 'ok',
        database: 'connected',
        timestamp: expect.any(String),
      }),
    );
  });

  it('should return module status summary', async () => {
    const result = await controller.modules();

    expect(moduleRegistry.getEnabledCount).toHaveBeenCalled();
    expect(moduleRegistry.getModules).toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        enabledCount: 1,
        totalCount: 1,
        modules: expect.any(Array),
        timestamp: expect.any(String),
      }),
    );
  });
});
