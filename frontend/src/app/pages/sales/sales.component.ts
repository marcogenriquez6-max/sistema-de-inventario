import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Paginated, SaleDocument } from '../../core/models';
import { StatusChipComponent } from '../../shared/status-chip.component';
import { ExportButtonComponent } from '../../shared/export-button.component';

@Component({
  selector: 'app-sales',
  imports: [FormsModule, StatusChipComponent, CommonModule, ExportButtonComponent],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Ventas</h1>
          <p class="muted small">Historial de notas de venta y facturas</p>
        </div>
        <app-export-button resource="sales" [params]="{ q: q }" />
      </div>

      <div class="card">
        <div class="toolbar">
          <input
            class="input search"
            placeholder="Buscar por documento o cliente…"
            [(ngModel)]="q"
            (keyup.enter)="load(1)"
          />
          <select class="select filter" [(ngModel)]="docType">
            <option value="">Todo tipo</option>
            <option value="NOTA">Nota</option>
            <option value="FACTURA">Factura</option>
          </select>
          <select class="select filter" [(ngModel)]="status">
            <option value="">Todo estado</option>
            <option value="COMPLETED">Completado</option>
            <option value="VOIDED">Anulado</option>
          </select>
          <input class="input date" type="date" [(ngModel)]="from" />
          <input class="input date" type="date" [(ngModel)]="to" />
          <button class="btn btn-primary" (click)="load(1)">Buscar</button>
          <button class="btn btn-ghost" (click)="reset()">Limpiar</button>
        </div>

        <div class="table-wrap">
          <table class="data">
            <thead>
              <tr>
                <th>Doc</th>
                <th>Tipo</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Subtotal</th>
                <th>IVA</th>
                <th>Total</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (doc of items(); track doc.id) {
                <tr>
                  <td class="mono">{{ doc.docNumber }}</td>
                  <td>
                    <span
                      [class]="'chip ' + (doc.docType === 'FACTURA' ? 'chip-info' : 'chip-neutral')"
                    >
                      {{ doc.docType }}
                    </span>
                  </td>
                  <td>{{ doc.customerName }}</td>
                  <td>{{ doc.createdAt | date: 'short' }}</td>
                  <td>Bs {{ doc.subtotal | number: '1.2-2' }}</td>
                  <td>Bs {{ doc.taxAmount | number: '1.2-2' }}</td>
                  <td>
                    <strong>Bs {{ doc.total | number: '1.2-2' }}</strong>
                  </td>
                  <td><app-status-chip [value]="doc.status" /></td>
                  <td>
                    <div class="actions">
                      <button class="btn btn-ghost btn-sm" (click)="toggle(doc.id)">
                        {{ expanded() === doc.id ? 'Ocultar' : 'Detalle' }}
                      </button>
                      @if (canVoid(doc)) {
                        <button class="btn btn-danger btn-sm" (click)="voidDoc(doc)">Anular</button>
                      }
                    </div>
                  </td>
                </tr>
                @if (expanded() === doc.id) {
                  <tr class="detail-row">
                    <td colspan="9">
                      <table class="data sub">
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Precio unit.</th>
                            <th>Total línea</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (it of doc.items; track it.id) {
                            <tr>
                              <td>{{ it.productName }}</td>
                              <td>{{ it.quantity }}</td>
                              <td>Bs {{ it.unitSale | number: '1.2-2' }}</td>
                              <td>
                                <strong>Bs {{ it.lineTotal | number: '1.2-2' }}</strong>
                              </td>
                            </tr>
                          } @empty {
                            <tr>
                              <td colspan="4">
                                <div class="empty">
                                  <div class="icon">🧾</div>
                                  Sin items
                                </div>
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </td>
                  </tr>
                }
              } @empty {
                <tr>
                  <td colspan="9">
                    <div class="empty">
                      <div class="icon">🧾</div>
                      Sin ventas registradas
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="pagination">
          <span>{{ meta().totalItems }} ventas</span>
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
      flex-wrap: wrap;
    }
    .search {
      max-width: 260px;
    }
    .filter {
      max-width: 150px;
    }
    .date {
      max-width: 150px;
    }
    .actions {
      display: flex;
      gap: 6px;
    }
    .btn-sm {
      padding: 4px 10px;
      font-size: 12.5px;
    }
    .detail-row td {
      background: var(--surface-2);
    }
    table.sub {
      margin: 0;
    }
    table.sub th {
      background: var(--surface);
    }
  `,
})
export class SalesComponent {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  items = signal<SaleDocument[]>([]);
  meta = signal({ page: 1, pageSize: 20, totalItems: 0, totalPages: 0 });
  expanded = signal<number | null>(null);

  q = '';
  docType = '';
  status = '';
  from = '';
  to = '';

  constructor() {
    this.load(1);
  }

  load(page: number): void {
    this.api
      .get<Paginated<SaleDocument>>('/sales', {
        page,
        pageSize: 20,
        docType: this.docType || undefined,
        status: this.status || undefined,
        from: this.from || undefined,
        to: this.to || undefined,
        q: this.q || undefined,
      })
      .subscribe((res) => {
        this.items.set(res.items);
        this.meta.set(res.meta);
      });
  }

  reset(): void {
    this.q = '';
    this.docType = '';
    this.status = '';
    this.from = '';
    this.to = '';
    this.load(1);
  }

  toggle(id: number): void {
    this.expanded.set(this.expanded() === id ? null : id);
  }

  canVoid(doc: SaleDocument): boolean {
    return doc.status === 'COMPLETED' && this.auth.hasRole('ADMIN');
  }

  async voidDoc(doc: SaleDocument): Promise<void> {
    if (
      !confirm(
        `¿Anular la venta ${doc.docNumber} por ${doc.customerName}? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }
    try {
      await this.api.post(`/sales/${doc.id}/void`).toPromise();
      this.toast.success(`Venta ${doc.docNumber} anulada`);
      this.load(this.meta().page);
    } catch {
      /* toast del interceptor */
    }
  }
}
