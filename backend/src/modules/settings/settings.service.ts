import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting, SettingHistory } from './settings.entity';
import { DomainException } from '../../common/domain-exceptions';

export interface TaxConfig {
  value: number;
}

/**
 * Servicio de parámetros globales con cache en memoria e invalidación por
 * evento. Versiona cada cambio en settings_history para auditoría histórica.
 */
@Injectable()
export class SettingsService implements OnApplicationBootstrap {
  private cache = new Map<string, unknown>();

  constructor(
    @InjectRepository(Setting)
    private readonly settingRepo: Repository<Setting>,
    @InjectRepository(SettingHistory)
    private readonly historyRepo: Repository<SettingHistory>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.refreshCache();
  }

  private async refreshCache(): Promise<void> {
    const all = await this.settingRepo.find();
    this.cache.clear();
    for (const s of all) {
      this.cache.set(s.key, s.value);
    }
  }

  /** Obtiene un parámetro, priorizando la cache en memoria. */
  async get<T = Record<string, unknown>>(key: string): Promise<T | null> {
    if (this.cache.has(key)) {
      return this.cache.get(key) as T;
    }
    const setting = await this.settingRepo.findOne({ where: { key } });
    if (!setting) {
      return null;
    }
    this.cache.set(key, setting.value);
    return setting.value as T;
  }

  /** Porcentaje de IVA vigente (ej: { value: 16 }). */
  async getTaxRate(): Promise<number> {
    const tax = await this.get<TaxConfig>('tax_rate');
    return tax?.value ?? 0;
  }

  /** Margen de ganancia por defecto sobre el costo (porcentaje). */
  async getDefaultMarginPct(): Promise<number> {
    const margin = await this.get<{ value: number }>('default_margin_pct');
    return margin?.value ?? 0;
  }

  /** Actualiza un parámetro, versiona el valor anterior y refresca la cache. */
  async set(
    key: string,
    value: Record<string, unknown>,
    userId: number | null,
  ): Promise<Setting> {
    const existing = await this.settingRepo.findOne({ where: { key } });

    if (existing) {
      await this.historyRepo.save(
        this.historyRepo.create({
          key,
          value: existing.value,
          changedBy: userId,
        }),
      );
      existing.value = value;
      existing.updatedBy = userId;
      await this.settingRepo.save(existing);
    } else {
      await this.settingRepo.save(
        this.settingRepo.create({ key, value, updatedBy: userId }),
      );
    }

    this.cache.set(key, value);
    return this.settingRepo.findOneOrFail({ where: { key } });
  }

  async getAll(): Promise<Setting[]> {
    return this.settingRepo.find();
  }

  /** Historial de cambios de un parámetro. */
  async getHistory(key: string): Promise<SettingHistory[]> {
    return this.historyRepo.find({
      where: { key },
      order: { changedAt: 'DESC' },
    });
  }

  async getSettingOrFail(key: string): Promise<Setting> {
    const s = await this.settingRepo.findOne({ where: { key } });
    if (!s) {
      throw new DomainException(404, `Parámetro "${key}" no configurado`);
    }
    return s;
  }
}
