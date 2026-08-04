import { Test, TestingModule } from '@nestjs/testing';
import { PricingService } from './pricing.service';
import { SettingsService } from '../settings/settings.service';

describe('PricingService', () => {
  let service: PricingService;
  let settingsService: {
    getTaxRate: jest.Mock;
    getDefaultMarginPct: jest.Mock;
  };

  beforeEach(async () => {
    settingsService = {
      getTaxRate: jest.fn().mockResolvedValue(16),
      getDefaultMarginPct: jest.fn().mockResolvedValue(50),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricingService,
        { provide: SettingsService, useValue: settingsService },
      ],
    }).compile();

    service = module.get(PricingService);
  });

  it('getTaxRate delega en settings', async () => {
    await expect(service.getTaxRate()).resolves.toBe(16);
  });

  it('computeSalePrice aplica IVA sobre la base (15 → 17.40)', async () => {
    await expect(service.computeSalePrice(15)).resolves.toBe(17.4);
  });

  it('computeSalePrice acepta un IVA explícito', async () => {
    await expect(service.computeSalePrice(100, 0)).resolves.toBe(100);
  });

  it('computeSuggestedBasePrice aplica el margen global (10 → 15)', async () => {
    await expect(service.computeSuggestedBasePrice(10)).resolves.toBe(15);
  });

  it('breakdown devuelve el desglose completo', async () => {
    const bd = await service.breakdown(10, 15, 16);

    expect(bd).toEqual({
      costPrice: 10,
      basePrice: 15,
      salePrice: 17.4,
      taxRate: 16,
      taxAmount: 2.4,
      marginPct: 50,
    });
  });

  it('round redondea a 2 decimales', () => {
    expect(service.round(1.005)).toBe(1.01);
  });
});
