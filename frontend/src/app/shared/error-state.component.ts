import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-error-state',
  template: `
    <div class="error" role="alert">
      <div class="icon" aria-hidden="true">⚠️</div>
      <div class="title">{{ title() }}</div>
      @if (message()) {
        <div class="msg muted small">{{ message() }}</div>
      }
      @if (retryable()) {
        <button class="btn btn-ghost" (click)="retry.emit()">Reintentar</button>
      }
    </div>
  `,
  styles: `
    .error {
      text-align: center;
      padding: 48px 20px;
      color: var(--text-secondary);
    }
    .icon {
      font-size: 40px;
      margin-bottom: 8px;
    }
    .title {
      font-weight: 600;
      color: var(--danger);
      margin-bottom: 4px;
    }
    .msg {
      margin: 0 auto 14px;
      max-width: 420px;
    }
  `,
})
export class ErrorStateComponent {
  readonly title = input('No se pudo cargar la información');
  readonly message = input('');
  readonly retryable = input(true);
  readonly retry = output();
}
