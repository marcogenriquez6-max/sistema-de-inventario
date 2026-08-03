import { Component, input, signal } from '@angular/core';
import { ExportFormat, ExportService } from '../core/services/export.service';
import { ToastService } from '../core/services/toast.service';

@Component({
  selector: 'app-export-button',
  template: `
    <div class="wrap">
      <button class="btn btn-ghost" (click)="menu.set(!menu())" [disabled]="busy()" aria-haspopup="menu">
        {{ busy() ? 'Exportando…' : '⬇️ Exportar' }}
      </button>
      @if (menu()) {
        <div class="menu" role="menu" (click)="$event.stopPropagation()">
          <button class="item" role="menuitem" (click)="doExport('csv')">📄 CSV</button>
          <button class="item" role="menuitem" (click)="doExport('xlsx')">📊 Excel</button>
          <button class="item" role="menuitem" (click)="doExport('pdf')">🖨️ PDF</button>
        </div>
      }
    </div>
  `,
  styles: `
    .wrap { position: relative; display: inline-block; }
    .menu {
      position: absolute;
      right: 0;
      top: calc(100% + 4px);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow-md);
      z-index: 40;
      padding: 4px;
      min-width: 150px;
      animation: pop 0.12s ease;
    }
    @keyframes pop {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .item {
      display: block;
      width: 100%;
      text-align: left;
      border: none;
      background: transparent;
      color: var(--text);
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      font-size: 13px;
      cursor: pointer;
      font-family: inherit;
    }
    .item:hover { background: var(--surface-hover); }
  `,
})
export class ExportButtonComponent {
  readonly resource = input.required<string>();
  readonly params = input<Record<string, string | number | boolean | undefined>>({});
  readonly menu = signal(false);
  readonly busy = signal(false);

  constructor(
    private exportService: ExportService,
    private toast: ToastService,
  ) {}

  async doExport(format: ExportFormat): Promise<void> {
    this.menu.set(false);
    this.busy.set(true);
    try {
      const res = await this.exportService
        .download(this.resource(), format, this.params())
        .toPromise();
      if (res) {
        this.exportService.saveFromResponse(res, `repuestos_${this.resource()}.${format}`);
        this.toast.success(`Exportado en ${format.toUpperCase()}`);
      }
    } catch {
      /* toast del interceptor */
    } finally {
      this.busy.set(false);
    }
  }
}
