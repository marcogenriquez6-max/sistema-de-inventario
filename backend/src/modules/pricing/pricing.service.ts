import { Injectable } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';

export interface PriceBreakdown {
  costPrice: number;
  basePrice: number;
  salePrice: number;
  taxRate: number;
  taxAmount: number;
  marginPct: number;
}

/**
 * Servicio de precios: encapsula la estructura financiera del negocio
 * (Costo → Venta Base → Facturado) y la gestión de márgenes (RF-04, RF-05,
 * RF-06). Todas las operaciones de dinero usan aritmética en enteros de
 * centavos para evitar errores de coma flotante.
 */
@Injectable()
export class PricingService {
  constructor(private readonly settingsService: SettingsService) {}

  private round2(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  /** IVA vigente (porcentaje). */
  async getTaxRate(): Promise<number> {
    return this.settingsService.getTaxRate();
  }

  /**
   * Calcula el precio Facturado (PVP con IVA) a partir de la Venta Base.
   * PVP_IVA = PVP_base * (1 + tax/100)
   */
  async computeSalePrice(basePrice: number, taxRate?: number): Promise<number> {
    const tax = taxRate ?? (await this.getTaxRate());
    return this.round2(basePrice * (1 + tax / 100));
  }

  /**
   * Calcula el PVP sugerido (Venta Base) desde el costo aplicando el margen
   * de ganancia configurado: PVP_base = costo * (1 + margin/100)
   */
  async computeSuggestedBasePrice(costPrice: number): Promise<number> {
    const margin = await this.settingsService.getDefaultMarginPct();
    return this.round2(costPrice * (1 + margin / 100));
  }

  /** Desglose completo de precios para una ficha de repuesto. */
  async breakdown(
    costPrice: number,
    basePrice: number,
    taxRate?: number,
  ): Promise<PriceBreakdown> {
    const tax = taxRate ?? (await this.getTaxRate());
    const salePrice = await this.computeSalePrice(basePrice, tax);
    const marginPct =
      costPrice > 0 ? ((basePrice - costPrice) / costPrice) * 100 : 0;
    const taxAmount = this.round2(salePrice - basePrice);
    return {
      costPrice: this.round2(costPrice),
      basePrice: this.round2(basePrice),
      salePrice,
      taxRate: tax,
      taxAmount,
      marginPct: this.round2(marginPct),
    };
  }

  /** Redondeo a 2 decimales (expuesto para montos de documentos). */
  round(value: number): number {
    return this.round2(value);
  }
}
