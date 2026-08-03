import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuditLog, Paginated } from '../../core/models';
import { ExportButtonComponent } from '../../shared/export-button.component';

@Component({
  selector: 'app-audit',
  imports: [FormsModule, CommonModule, ExportButtonComponent],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Auditoría</h1>
          <p class="muted small">Registro de acciones del sistema (solo lectura)</p>
        </div>
        <app-export-button resource="audit" [params]="{ q: action }" />
      </div>

      <div class="card">
        <div class="toolbar">
          <input
            class="input search"
            placeholder="Filtrar por acción (CREATE, UPDATE, DELETE, LOGIN…)…"
            [(ngModel)]="action"
            (keyup.enter)="load(1)"
          />
          <button class="btn btn-primary" (click)="load(1)">Filtrar</button>
          <button class="btn btn-ghost" (click)="reset()">Limpiar</button>
        </div>

        <div class="table-wrap">
          <table class="data">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Acción</th>
                <th>Recurso</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              @for (l of items(); track l.id) {
                <tr>
                  <td class="small muted">{{ l.createdAt | date: 'dd/MM/yyyy HH:mm:ss' }}</td>
                  <td>{{ l.user?.fullName || 'Sistema' }}</td>
                  <td>
                    <span class="chip chip-neutral">{{ l.action }}</span>
                  </td>
                  <td>
                    <span class="mono">{{ l.resourceType }}</span>
                    @if (l.resourceId) {
                      <span class="muted">:{{ l.resourceId }}</span>
                    }
                  </td>
                  <td class="mono small">{{ l.ip || '—' }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5">
                    <div class="empty">
                      <div class="icon">📋</div>
                      Sin registros
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="pagination">
          <span>{{ meta().totalItems }} registros</span>
          <div class="pages">
            <button (click)="load(meta().page - 1)" [disabled]="meta().page <= 1">‹</button>
            <span class="muted">Página {{ meta().page }} de {{ meta().totalPages || 1 }}</span>
            <button (click)="load(meta().page + 1)" [disabled]="meta().page >= meta().totalPages">
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    .toolbar {
      display: flex;
      gap: 8px;
      padding: 12px;
      border-bottom: 1px solid var(--border);
    }
    .search {
      max-width: 420px;
    }
  `,
})
export class AuditComponent {
  private api = inject(ApiService);

  items = signal<AuditLog[]>([]);
  meta = signal({ page: 1, pageSize: 20, totalItems: 0, totalPages: 0 });
  action = '';

  constructor() {
    this.load(1);
  }

  load(page: number): void {
    this.api
      .get<Paginated<AuditLog>>('/audit', { page, pageSize: 20, action: this.action || undefined })
      .subscribe((res) => {
        this.items.set(res.items);
        this.meta.set(res.meta);
      });
  }

  reset(): void {
    this.action = '';
    this.load(1);
  }
}
