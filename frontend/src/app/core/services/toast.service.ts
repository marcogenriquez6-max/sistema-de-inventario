import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

let nextId = 1;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private list = signal<Toast[]>([]);
  readonly toasts = this.list.asReadonly();

  show(type: Toast['type'], message: string): void {
    const id = nextId++;
    this.list.update((t) => [...t, { id, type, message }]);
    setTimeout(() => this.dismiss(id), 4200);
  }

  success(message: string): void {
    this.show('success', message);
  }
  error(message: string): void {
    this.show('error', message);
  }
  info(message: string): void {
    this.show('info', message);
  }

  dismiss(id: number): void {
    this.list.update((t) => t.filter((x) => x.id !== id));
  }
}
