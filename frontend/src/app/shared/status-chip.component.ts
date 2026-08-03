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

@Component({
  selector: 'app-status-chip',
  template: `<span class="chip {{ class() }}">{{ label() }}</span>`,
})
export class StatusChipComponent {
  readonly value = input.required<string>();
  readonly label = computed(() => this.display(this.value()));
  readonly class = computed(() => MAP[this.value()?.toUpperCase()] ?? 'chip-neutral');

  private display(v: string): string {
    return v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
}
