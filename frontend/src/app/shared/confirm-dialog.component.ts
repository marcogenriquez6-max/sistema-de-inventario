import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  template: `
    @if (visible()) {
      <div class="backdrop" (click)="close(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>{{ title() }}</h3>
          <p class="muted">{{ message() }}</p>
          <div class="actions">
            <button class="btn" (click)="close(false)">Cancelar</button>
            <button class="btn btn-danger" (click)="close(true)">{{ confirmLabel() }}</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .backdrop {
      position: fixed;
      inset: 0;
      background: rgba(10, 15, 25, 0.45);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .modal {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow-md);
      padding: 20px;
      width: min(420px, calc(100vw - 32px));
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 18px;
    }
  `,
})
export class ConfirmDialogComponent {
  readonly title = signal('¿Confirmar acción?');
  readonly message = signal('');
  readonly confirmLabel = signal('Confirmar');
  readonly visible = signal(false);
  private resolver?: (ok: boolean) => void;

  open(title: string, message: string, confirmLabel = 'Confirmar'): Promise<boolean> {
    this.title.set(title);
    this.message.set(message);
    this.confirmLabel.set(confirmLabel);
    this.visible.set(true);
    return new Promise((resolve) => (this.resolver = resolve));
  }

  close(ok: boolean): void {
    this.visible.set(false);
    this.resolver?.(ok);
    this.resolver = undefined;
  }
}
