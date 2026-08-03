import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Paginated, Product, StockMovement } from '../../core/models';
import { ExportButtonComponent } from '../../shared/export-button.component';

interface LowStockItem {
  id: number;
  sku: string;
  name: string;
  stock: number;
  minStock: number;
}

@Component({
  selector: 'app-inventory',
  imports: [FormsModule, CommonModule, ExportButtonComponent],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Inventario</h1>
          <p class="muted small">Kardex por producto y control de existencias</p>
        </div>
        <app-export-button resource="inventory" />
      </div>

      <div class="card">
        <div class="section-head">
          <div>
            <h3>Stock crítico</h3>
            <p class="muted small">Productos por debajo del mínimo</p>
          </div>
        </div>
        <div class="table-wrap">
          <table class="data">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Producto</th>
                <th>Stock</th>
                <th>Mínimo</th>
              </tr>
            </thead>
            <tbody>
              @for (p of lowStock(); track p.id) {
                <tr>
                  <td class="mono">{{ p.sku }}</td>
                  <td>
                    <strong>{{ p.name }}</strong>
                  </td>
                  <td class="qty-neg">{{ p.stock }}</td>
                  <td>{{ p.minStock }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4">
                    <div class="empty">
                      <div class="icon">✅</div>
                      Ningún producto en stock crítico
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="section-head">
          <div>
            <h3>Kardex de producto</h3>
            <p class="muted small">Movimientos de inventario del producto seleccionado</p>
          </div>
          <select
            class="select product-select"
            [(ngModel)]="selectedProductId"
            (change)="onProductChange()"
          >
            <option [ngValue]="null">Seleccione un producto…</option>
            @for (p of products(); track p.id) {
              <option [ngValue]="p.id">{{ p.sku }} — {{ p.name }}</option>
            }
          </select>
        </div>

        @if (selectedProductId() === null) {
          <div class="empty">
            <div class="icon">📦</div>
            Seleccione un producto para ver su kardex
          </div>
        } @else {
          <div class="table-wrap">
            <table class="data">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Cantidad</th>
                  <th>Costo</th>
                  <th>PVP</th>
                  <th>Concepto / Ref</th>
                  <th>Usuario</th>
                </tr>
              </thead>
              <tbody>
                @for (m of movements(); track m.id) {
                  <tr>
                    <td>{{ m.createdAt | date: 'short' }}</td>
                    <td>
                      <span [class]="'chip ' + movementClass(m.movementType)">{{
                        m.movementType
                      }}</span>
                    </td>
                    <td [class]="m.quantity < 0 ? 'qty-neg' : 'qty-pos'">
                      {{ m.quantity > 0 ? '+' : '' }}{{ m.quantity }}
                    </td>
                    <td>Bs {{ m.unitCost | number: '1.2-2' }}</td>
                    <td>Bs {{ m.unitSale | number: '1.2-2' }}</td>
                    <td>
                      @if (m.concept) {
                        {{ m.concept }}
                      }
                      @if (m.referenceType) {
                        <span class="small muted">
                          @if (m.concept) {
                            ·
                          }
                          {{ m.referenceType }} {{ m.referenceId }}
                        </span>
                      }
                      @if (!m.concept && !m.referenceType) {
                        —
                      }
                    </td>
                    <td>{{ m.user?.fullName ?? '—' }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7">
                      <div class="empty">
                        <div class="icon">📦</div>
                        Sin movimientos
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="pagination">
            <span>{{ meta().totalItems }} movimientos</span>
            <div class="pages">
              <button (click)="loadKardex(meta().page - 1)" [disabled]="meta().page <= 1">‹</button>
              <span class="muted">Página {{ meta().page }} de {{ meta().totalPages || 1 }}</span>
              <button
                (click)="loadKardex(meta().page + 1)"
                [disabled]="meta().page >= meta().totalPages"
              >
                ›
              </button>
            </div>
          </div>
        }
      </div>

      @if (canManage()) {
        <div class="card card-pad">
          <h3>Ajuste de stock</h3>
          <p class="muted small">
            Registrar entrada (positiva) o salida (negativa) manual de existencias
          </p>
          <form (ngSubmit)="submitAdjust()">
            <div class="form-grid">
              <div class="field">
                <label>Producto</label>
                <select class="select" [(ngModel)]="formProductId" name="formProductId" required>
                  <option [ngValue]="null">Seleccione un producto…</option>
                  @for (p of products(); track p.id) {
                    <option [ngValue]="p.id">{{ p.sku }} — {{ p.name }}</option>
                  }
                </select>
              </div>
              <div class="field">
                <label>Tipo de movimiento</label>
                <select class="select" [(ngModel)]="movementType" name="movementType">
                  <option value="ADJUST">Ajuste</option>
                  <option value="MERMA">Merma</option>
                  <option value="RETURN">Devolución</option>
                </select>
              </div>
              <div class="field">
                <label>Cantidad (con signo)</label>
                <input
                  class="input"
                  type="number"
                  step="any"
                  placeholder="Ej: +5 o -3"
                  [(ngModel)]="quantity"
                  name="quantity"
                  required
                />
              </div>
              <div class="field">
                <label>Concepto</label>
                <input
                  class="input"
                  placeholder="Motivo del ajuste (opcional)"
                  [(ngModel)]="concept"
                  name="concept"
                />
              </div>
            </div>
            <button class="btn btn-primary" type="submit" [disabled]="saving()">
              {{ saving() ? 'Registrando…' : 'Registrar ajuste' }}
            </button>
          </form>
        </div>
      }
    </div>
  `,
  styles: `
    .section-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 16px;
      border-bottom: 1px solid var(--border);
      flex-wrap: wrap;
    }
    .product-select {
      max-width: 340px;
    }
    .qty-neg {
      color: var(--danger);
      font-weight: 650;
    }
    .qty-pos {
      color: var(--success);
      font-weight: 650;
    }
    .pagination {
      border-top: 1px solid var(--border);
    }
  `,
})
export class InventoryComponent {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  readonly canManage = computed(() => this.auth.hasRole('ADMIN', 'INVENTORY_MANAGER'));

  lowStock = signal<LowStockItem[]>([]);
  products = signal<Product[]>([]);
  movements = signal<StockMovement[]>([]);
  meta = signal({ page: 1, pageSize: 20, totalItems: 0, totalPages: 0 });
  selectedProductId = signal<number | null>(null);
  saving = signal(false);

  formProductId: number | null = null;
  movementType = 'ADJUST';
  quantity: number | null = null;
  concept = '';

  constructor() {
    this.loadLowStock();
    this.loadProducts();
  }

  private loadLowStock(): void {
    this.api
      .get<{ items: LowStockItem[]; total: number }>('/reports/low-stock')
      .subscribe((res) => this.lowStock.set(res.items));
  }

  private loadProducts(): void {
    this.api
      .get<Paginated<Product>>('/products', { page: 1, pageSize: 1000 })
      .subscribe((res) => this.products.set(res.items));
  }

  onProductChange(): void {
    this.loadKardex(1);
  }

  loadKardex(page: number): void {
    const id = this.selectedProductId();
    if (id === null) return;
    this.api
      .get<Paginated<StockMovement>>(`/inventory/kardex/${id}`, { page, pageSize: 20 })
      .subscribe((res) => {
        this.movements.set(res.items);
        this.meta.set(res.meta);
      });
  }

  async submitAdjust(): Promise<void> {
    const productId = this.formProductId;
    if (productId === null) {
      this.toast.error('Seleccione un producto');
      return;
    }
    if (
      this.quantity === null ||
      this.quantity === undefined ||
      Number.isNaN(Number(this.quantity))
    ) {
      this.toast.error('Indique una cantidad válida');
      return;
    }
    this.saving.set(true);
    const payload = {
      productId,
      movementType: this.movementType,
      quantity: Number(this.quantity),
      concept: this.concept.trim() || undefined,
    };
    try {
      await this.api.post('/inventory/adjustments', payload).toPromise();
      this.toast.success('Ajuste de stock registrado');
      this.selectedProductId.set(productId);
      this.quantity = null;
      this.concept = '';
      this.loadKardex(1);
      this.loadLowStock();
    } catch {
      /* toast del interceptor */
    } finally {
      this.saving.set(false);
    }
  }

  movementClass(type: string): string {
    switch (type?.toUpperCase()) {
      case 'SALE':
        return 'chip-danger';
      case 'PURCHASE':
        return 'chip-success';
      case 'ADJUST':
        return 'chip-info';
      case 'MERMA':
        return 'chip-warning';
      case 'RETURN':
        return 'chip-info';
      default:
        return 'chip-neutral';
    }
  }
}
