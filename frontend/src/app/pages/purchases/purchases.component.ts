import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { Paginated, Product, PurchaseDocument, Supplier } from '../../core/models';
import { StatusChipComponent } from '../../shared/status-chip.component';
import { ExportButtonComponent } from '../../shared/export-button.component';

interface LineForm {
  productId: number | null;
  quantity: number;
  unitCost: number;
}

function emptyLine(): LineForm {
  return { productId: null, quantity: 1, unitCost: 0 };
}

@Component({
  selector: 'app-purchases',
  imports: [FormsModule, StatusChipComponent, CommonModule, ExportButtonComponent],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Compras</h1>
          <p class="muted small">Registro de compras a proveedores y su historial</p>
        </div>
        <button class="btn btn-primary" (click)="openNew()">+ Nueva compra</button>
        <app-export-button resource="purchases" [params]="{ q: q }" />
      </div>

      <div class="card">
        <div class="toolbar">
          <input
            class="input search"
            placeholder="Buscar por documento o proveedor…"
            [(ngModel)]="q"
            (keyup.enter)="load(1)"
          />
          <button class="btn btn-primary" (click)="load(1)">Buscar</button>
          <button class="btn btn-ghost" (click)="reset()">Limpiar</button>
        </div>

        <div class="table-wrap">
          <table class="data">
            <thead>
              <tr>
                <th>Doc</th>
                <th>Proveedor</th>
                <th>Factura</th>
                <th>Subtotal</th>
                <th>IVA</th>
                <th>Total</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (doc of items(); track doc.id) {
                <tr>
                  <td class="mono">{{ doc.docNumber }}</td>
                  <td>{{ doc.supplierName }}</td>
                  <td>{{ doc.invoiceNumber || '—' }}</td>
                  <td>Bs {{ doc.subtotal | number: '1.2-2' }}</td>
                  <td>Bs {{ doc.taxAmount | number: '1.2-2' }}</td>
                  <td>
                    <strong>Bs {{ doc.total | number: '1.2-2' }}</strong>
                  </td>
                  <td>{{ doc.createdAt | date: 'short' }}</td>
                  <td><app-status-chip [value]="doc.status" /></td>
                  <td>
                    <button class="btn btn-ghost btn-sm" (click)="toggle(doc.id)">
                      {{ expanded() === doc.id ? 'Ocultar' : 'Detalle' }}
                    </button>
                  </td>
                </tr>
                @if (expanded() === doc.id) {
                  <tr class="detail-row">
                    <td colspan="9">
                      <table class="data sub">
                        <thead>
                          <tr>
                            <th>SKU</th>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Costo unit.</th>
                            <th>Total línea</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (it of doc.items; track it.id) {
                            <tr>
                              <td class="mono">{{ it.productSku }}</td>
                              <td>{{ it.productName }}</td>
                              <td>{{ it.quantity }}</td>
                              <td>Bs {{ it.unitCost | number: '1.2-2' }}</td>
                              <td>
                                <strong>Bs {{ it.lineTotal | number: '1.2-2' }}</strong>
                              </td>
                            </tr>
                          } @empty {
                            <tr>
                              <td colspan="5">
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
                      Sin compras registradas
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="pagination">
          <span>{{ meta().totalItems }} compras</span>
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

    @if (modalOpen()) {
      <div class="backdrop" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>Nueva compra</h3>
          <form #f="ngForm" (ngSubmit)="save()">
            <div class="form-grid">
              <div class="field">
                <label>Proveedor *</label>
                <select class="select" name="supplierId" [(ngModel)]="form().supplierId" required>
                  <option [ngValue]="null">Seleccione un proveedor…</option>
                  @for (s of suppliers(); track s.id) {
                    <option [ngValue]="s.id">{{ s.name }} ({{ s.code }})</option>
                  }
                </select>
              </div>
              <div class="field">
                <label>Nº de factura</label>
                <input class="input" name="invoiceNumber" [(ngModel)]="form().invoiceNumber" />
              </div>
            </div>

            <div class="field">
              <label>Líneas de compra</label>
              <div class="line-head">
                <span>Producto *</span><span>Cantidad</span><span>Costo unit. (Bs)</span
                ><span></span>
              </div>
              @for (line of lines(); track $index; let i = $index) {
                <div class="line-row">
                  <select
                    class="select"
                    [name]="'product_' + i"
                    [ngModel]="line.productId"
                    (ngModelChange)="setLineProduct(i, $event)"
                  >
                    <option [ngValue]="null">Seleccione un repuesto…</option>
                    @for (p of products(); track p.id) {
                      <option [ngValue]="p.id">{{ p.sku }} · {{ p.name }}</option>
                    }
                  </select>
                  <input
                    class="input"
                    type="number"
                    min="1"
                    [name]="'qty_' + i"
                    [ngModel]="line.quantity"
                    (ngModelChange)="setLineQty(i, $event)"
                  />
                  <input
                    class="input"
                    type="number"
                    min="0"
                    step="0.01"
                    [name]="'cost_' + i"
                    [ngModel]="line.unitCost"
                    (ngModelChange)="setLineCost(i, $event)"
                  />
                  <button type="button" class="btn btn-ghost btn-sm" (click)="removeLine(i)">
                    ✕
                  </button>
                </div>
              }
              <button type="button" class="btn btn-ghost btn-sm" (click)="addLine()">
                + Agregar línea
              </button>
            </div>

            <div class="subtotal">
              <span>Subtotal</span>
              <strong>Bs {{ subtotal() | number: '1.2-2' }}</strong>
            </div>

            <div class="actions">
              <button type="button" class="btn btn-ghost" (click)="closeModal()">Cancelar</button>
              <button type="submit" class="btn btn-primary" [disabled]="saving()">
                {{ saving() ? 'Guardando…' : 'Guardar compra' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: `
    .toolbar {
      display: flex;
      gap: 8px;
      padding: 12px;
      border-bottom: 1px solid var(--border);
    }
    .search {
      max-width: 320px;
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
    .backdrop {
      position: fixed;
      inset: 0;
      background: rgba(10, 15, 25, 0.45);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .modal {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow-md);
      padding: 20px;
      width: min(720px, 100%);
      max-height: calc(100vh - 48px);
      overflow: auto;
    }
    .line-head {
      display: grid;
      grid-template-columns: 1fr 90px 120px 40px;
      gap: 8px;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
      margin-bottom: 4px;
    }
    .line-row {
      display: grid;
      grid-template-columns: 1fr 90px 120px 40px;
      gap: 8px;
      margin-bottom: 8px;
    }
    .line-row .select,
    .line-row .input {
      padding: 7px 9px;
      font-size: 13px;
    }
    .subtotal {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      align-items: center;
      padding: 12px 14px;
      background: var(--surface-2);
      border-radius: var(--radius-sm);
      font-size: 15px;
      margin-top: 6px;
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 18px;
    }
  `,
})
export class PurchasesComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  items = signal<PurchaseDocument[]>([]);
  meta = signal({ page: 1, pageSize: 20, totalItems: 0, totalPages: 0 });
  expanded = signal<number | null>(null);
  q = '';

  suppliers = signal<Supplier[]>([]);
  products = signal<Product[]>([]);

  modalOpen = signal(false);
  saving = signal(false);
  form = signal<{ supplierId: number | null; invoiceNumber: string }>({
    supplierId: null,
    invoiceNumber: '',
  });
  lines = signal<LineForm[]>([]);

  readonly subtotal = computed(() =>
    this.lines().reduce((acc, l) => acc + (l.quantity || 0) * (l.unitCost || 0), 0),
  );

  constructor() {
    this.load(1);
    this.loadSuppliers();
    this.loadProducts();
  }

  load(page: number): void {
    this.api
      .get<Paginated<PurchaseDocument>>('/purchases', {
        page,
        pageSize: 20,
        q: this.q || undefined,
      })
      .subscribe((res) => {
        this.items.set(res.items);
        this.meta.set(res.meta);
      });
  }

  loadSuppliers(): void {
    this.api
      .get<Paginated<Supplier>>('/suppliers', { page: 1, pageSize: 200 })
      .subscribe((res) => this.suppliers.set(res.items));
  }

  loadProducts(): void {
    this.api
      .get<Paginated<Product>>('/products', { page: 1, pageSize: 200 })
      .subscribe((res) => this.products.set(res.items));
  }

  reset(): void {
    this.q = '';
    this.load(1);
  }

  toggle(id: number): void {
    this.expanded.set(this.expanded() === id ? null : id);
  }

  openNew(): void {
    this.form.set({ supplierId: null, invoiceNumber: '' });
    this.lines.set([emptyLine()]);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  addLine(): void {
    this.lines.update((ls) => [...ls, emptyLine()]);
  }

  removeLine(i: number): void {
    this.lines.update((ls) => ls.filter((_, idx) => idx !== i));
  }

  setLineProduct(i: number, productId: number | null): void {
    this.lines.update((ls) => ls.map((l, idx) => (idx === i ? { ...l, productId } : l)));
  }

  setLineQty(i: number, quantity: number): void {
    this.lines.update((ls) => ls.map((l, idx) => (idx === i ? { ...l, quantity } : l)));
  }

  setLineCost(i: number, unitCost: number): void {
    this.lines.update((ls) => ls.map((l, idx) => (idx === i ? { ...l, unitCost } : l)));
  }

  async save(): Promise<void> {
    const f = this.form();
    const items = this.lines()
      .filter((l) => l.productId != null)
      .map((l) => ({
        productId: l.productId as number,
        quantity: l.quantity,
        unitCost: l.unitCost,
      }));
    if (!f.supplierId || items.length === 0) {
      this.toast.error('Seleccione un proveedor y al menos una línea con producto');
      return;
    }
    this.saving.set(true);
    const payload = {
      supplierId: f.supplierId,
      invoiceNumber: f.invoiceNumber || undefined,
      items,
    };
    try {
      const doc = await this.api.post<PurchaseDocument>('/purchases', payload).toPromise();
      if (!doc) return;
      this.toast.success(`Compra ${doc.docNumber} registrada`);
      this.closeModal();
      this.load(this.meta().page);
    } catch {
      /* toast del interceptor */
    } finally {
      this.saving.set(false);
    }
  }
}
