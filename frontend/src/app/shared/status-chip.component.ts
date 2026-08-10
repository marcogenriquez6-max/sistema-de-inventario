import { Component, computed, input } from '@angular/core';

const MAP: Record<string, string> = {
  COMPLETED: 'chip-success',
  RECEIVED: 'chip-success',
  OPEN: 'chip-success',
  ACTIVE: 'chip-success',
  VOIDED: 'chip-danger',
  CANCELLED: 'chip-danger',
  CLOSED: 'chip-neutral',
  INACTIVE: 'chip-neutral',
  PENDING: 'chip-warning',
  LOW_STOCK: 'chip-warning',
  TRUE: 'chip-success',
  FALSE: 'chip-neutral',
  OUT: 'chip-danger',
  IN: 'chip-success',
};

const LABELS: Record<string, string> = {
  COMPLETED: 'Completado',
  RECEIVED: 'Recibido',
  OPEN: 'Abierta',
  ACTIVE: 'Activo',
  VOIDED: 'Anulada',
  CANCELLED: 'Anulada',
  CLOSED: 'Cerrada',
  INACTIVE: 'Inactivo',
  PENDING: 'Pendiente',
  LOW_STOCK: 'Stock bajo',
  TRUE: 'Activo',
  FALSE: 'Inactivo',
  OUT: 'Salida',
  IN: 'Entrada',
};

@Component({
  selector: 'app-status-chip',
  template: `<span class="chip {{ class() }}">{{ label() }}</span>`,
})
export class StatusChipComponent {
  readonly value = input.required<string>();
  readonly label = computed(() => this.translate(this.value()));
  readonly class = computed(() => MAP[this.value()?.toUpperCase()] ?? 'chip-neutral');

  private translate(v: string): string {
    return LABELS[v?.toUpperCase()] ?? this.titleCase(v);
  }

  private titleCase(v: string): string {
    return v
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
}
