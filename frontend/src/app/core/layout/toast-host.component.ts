import { Component } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast-host',
  template: `
    <div class="toast-host">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast toast-{{ t.type }}" (click)="toast.dismiss(t.id)">
          <span class="toast-icon">{{ icon(t.type) }}</span>
          <span>{{ t.message }}</span>
        </div>
      }
    </div>
  `,
  styles: `
    .toast-host {
      position: fixed;
      top: 70px;
      right: 18px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 360px;
    }
    .toast {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      box-shadow: var(--shadow-md);
      padding: 10px 12px;
      font-size: 13px;
      cursor: pointer;
      animation: toast-in 0.18s ease;
    }
    @keyframes toast-in {
      from {
        opacity: 0;
        transform: translateX(12px);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
    .toast-success {
      border-left: 3px solid var(--success);
    }
    .toast-error {
      border-left: 3px solid var(--danger);
    }
    .toast-info {
      border-left: 3px solid var(--info);
    }
    .toast-warning {
      border-left: 3px solid var(--warning);
    }
  `,
})
export class ToastHostComponent {
  constructor(readonly toast: ToastService) {}

  icon(type: string): string {
    return type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
  }
}
