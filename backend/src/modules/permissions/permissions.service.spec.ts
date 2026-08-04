import { Test } from '@nestjs/testing';
import {
  PermissionsService,
  defaultPermissionMatrix,
  PERMISSION_MODULES,
} from './permissions.service';
import { SettingsService } from '../settings/settings.service';

describe('PermissionsService', () => {
  let service: PermissionsService;
  let settings: {
    get: jest.Mock;
    set: jest.Mock;
  };

  beforeEach(async () => {
    settings = {
      get: jest.fn(),
      set: jest.fn().mockResolvedValue({}),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        PermissionsService,
        { provide: SettingsService, useValue: settings },
      ],
    }).compile();
    service = moduleRef.get(PermissionsService);
    jest.clearAllMocks();
  });

  describe('getMatrix', () => {
    it('siembra la matriz por defecto cuando no existe', async () => {
      settings.get.mockResolvedValue(null);

      const matrix = await service.getMatrix();

      expect(settings.set).toHaveBeenCalledWith(
        'role_permissions',
        expect.any(Object),
        null,
      );
      expect(matrix.ADMIN).toBeDefined();
      expect(matrix.SELLER.sales).toBe(true);
    });

    it('usa la matriz guardada si existe', async () => {
      const stored = defaultPermissionMatrix();
      stored.SELLER.sales = false;
      settings.get.mockResolvedValue(stored);

      const matrix = await service.getMatrix();

      expect(settings.set).not.toHaveBeenCalled();
      expect(matrix.SELLER.sales).toBe(false);
    });
  });

  describe('can', () => {
    it('ADMIN siempre tiene acceso a cualquier módulo', async () => {
      settings.get.mockResolvedValue(null);
      await expect(service.can('ADMIN', 'sales')).resolves.toBe(true);
      await expect(service.can('ADMIN', 'permissions')).resolves.toBe(true);
    });

    it('respeta la matriz para roles no-ADMIN', async () => {
      settings.get.mockResolvedValue(defaultPermissionMatrix());
      await expect(service.can('SELLER', 'sales')).resolves.toBe(true);
      await expect(service.can('SELLER', 'accounting')).resolves.toBe(false);
      await expect(service.can('AUDITOR', 'audit')).resolves.toBe(true);
    });
  });

  describe('setMatrix', () => {
    it('normaliza la matriz y la guarda', async () => {
      const input = defaultPermissionMatrix();
      input.MANAGER.banking = false;
      settings.get.mockResolvedValue(null);

      const result = await service.setMatrix(input, 1);

      expect(settings.set).toHaveBeenCalledWith(
        'role_permissions',
        expect.any(Object),
        1,
      );
      expect(result.MANAGER.banking).toBe(false);
      expect(result.MANAGER.pos).toBe(true);
      expect(result.ADMIN).toBeDefined();
    });

    it('rechaza matrices inválidas', async () => {
      await expect(service.setMatrix(null as never, 1)).rejects.toThrow(
        'Matriz de permisos inválida',
      );
      await expect(
        service.setMatrix({ SELLER: null } as never, 1),
      ).rejects.toThrow('Fila inválida para el rol SELLER');
    });
  });

  describe('resetMatrix', () => {
    it('restaura los valores por defecto', async () => {
      const result = await service.resetMatrix(2);
      expect(settings.set).toHaveBeenCalled();
      expect(result.MANAGER.accounting).toBe(true);
    });
  });

  it('lista los módulos disponibles', () => {
    expect(PERMISSION_MODULES).toContain('sales');
    expect(PERMISSION_MODULES).toContain('permissions');
  });
});
