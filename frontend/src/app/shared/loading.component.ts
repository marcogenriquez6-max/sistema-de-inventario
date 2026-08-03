import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading',
  template: `
    <div class="loading" role="status" aria-live="polite">
      <span class="spinner" aria-hidden="true"></span>
      <span class="muted small">{{ label() }}</span>
    </div>
  `,
  styles: `
    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 40px 16px;
    }
    .spinner {
      width: 20px;
      height: 20px;
      border: 2.5px solid var(--border);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `,
})
export class LoadingComponent {
  readonly label = input('Cargando…');
}
