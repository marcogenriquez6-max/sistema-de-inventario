import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JobsService } from './jobs.service';

const mockQueueInstances: Array<{ add: jest.Mock; close: jest.Mock }> = [];

jest.mock('ioredis', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    quit: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => {
    const instance = {
      add: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
    };
    mockQueueInstances.push(instance);
    return instance;
  }),
}));

describe('JobsService', () => {
  let service: JobsService;
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    mockQueueInstances.length = 0;
    configService = { get: jest.fn().mockReturnValue(null) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get(JobsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('se deshabilita cuando no hay REDIS_URL', async () => {
    await service.onModuleInit();

    expect(service.isEnabled).toBe(false);
    expect(mockQueueInstances).toHaveLength(0);
  });

  it('enqueueReport degrada sin cola disponible', async () => {
    const warn = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);

    await expect(
      service.enqueueReport({
        type: 'low-stock',
        params: {},
        requestedBy: 1,
      }),
    ).resolves.toBeUndefined();

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('no disponible'));
    warn.mockRestore();
  });

  describe('con Redis habilitado', () => {
    beforeEach(() => {
      configService.get.mockReturnValue('redis://localhost:6379');
      service = new JobsService(configService as never);
    });

    it('isEnabled es true y crea las colas en onModuleInit', async () => {
      expect(service.isEnabled).toBe(true);

      await service.onModuleInit();

      expect(mockQueueInstances).toHaveLength(2);
    });

    it('enqueueReport añade un job generate con reintentos', async () => {
      await service.onModuleInit();

      await service.enqueueReport({
        type: 'sales-by-day',
        params: {},
        requestedBy: 2,
      });

      expect(mockQueueInstances[0].add).toHaveBeenCalledWith(
        'generate',
        { type: 'sales-by-day', params: {}, requestedBy: 2 },
        expect.objectContaining({ attempts: 3 }),
      );
    });

    it('enqueueNotification prioriza 1 para mensajes high', async () => {
      await service.onModuleInit();

      await service.enqueueNotification({
        recipient: 3,
        title: 'Stock bajo',
        message: 'Filtro FA-001',
        priority: 'high',
      });

      expect(mockQueueInstances[1].add).toHaveBeenCalledWith(
        'send',
        expect.objectContaining({ recipient: 3 }),
        expect.objectContaining({ priority: 1 }),
      );
    });

    it('onModuleDestroy cierra colas y conexión', async () => {
      await service.onModuleInit();

      await service.onModuleDestroy();

      for (const q of mockQueueInstances) {
        expect(q.close).toHaveBeenCalled();
      }
    });
  });
});
