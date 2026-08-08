import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formatea un valor como dinero en bolivianos (Bs 1.234,56).
 * Locale-independent: usa separador de miles con punto y decimales con coma.
 */
@Pipe({ name: 'bs', standalone: true })
export class BsPipe implements PipeTransform {
  transform(value: string | number | null | undefined): string {
    const n = Number(value ?? 0);
    if (!Number.isFinite(n)) return 'Bs 0,00';
    const sign = n < 0 ? '-' : '';
    const abs = Math.abs(n);
    const [int, dec] = abs.toFixed(2).split('.');
    const thousands = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${sign}Bs ${thousands},${dec}`;
  }
}
