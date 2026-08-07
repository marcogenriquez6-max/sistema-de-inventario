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
          <p class="muted small">Existencias de repuestos, kardex y ajustes de stock</p>
        </div>
        <app-export-button resource="inventory" />
      </div>

      <div class="stat-grid">
        <div class="stat">
          <div class="label">Productos activos</div>
          <div class="value">{{ products().length }}</div>
        </div>
        <div class="stat">
          <div class="label">En stock crítico</div>
          <div class="value" [class.danger]="lowStock().length > 0">{{ lowStock().length }}</div>
        </div>
        <div class="stat">
          <div class="label">Unidades en inventario</div>
          <div class="value">{{ totalUnits() }}</div>
        </div>
        <div class="stat">
          <div class="label">Valorizado (costo)</div>
          <div class="value">Bs {{ totalValue() | number: '1.2-2' }}</div>
        </div>
      </div>

      <div class="card">
        <div class="section-head">
          <div>
            <h3>Existencias</h3>
            <p class="muted small">Clic en un producto para ver su kardex</p>
          </div>
          <div class="toolbar">
            <input
              class="input search"
              placeholder="Buscar por SKU, OEM o nombre…"
              [(ngModel)]="q"
              (keyup.enter)="applyFilter()"
            />
            <select class="select filter" [(ngModel)]="stockFilter" (change)="applyFilter()">
              <option value="all">Todo estado</option>
              <option value="ok">Con stock</option>
              <option value="low">Stock bajo</option>
              <option value="out">Agotado</option>
            </select>
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
                <th>Estado</th>
                <th>Costo</th>
                <th>PVP</th>
                <th>Kardex</th>
              </tr>
            </thead>
            <tbody>
              @for (p of filteredProducts(); track p.id) {
                <tr class="product-row" [class.selected]="selectedProductId() === p.id" (click)="selectProduct(p)">
                  <td class="mono">{{ p.sku }}</td>
                  <td>
                    <strong>{{ p.name }}</strong>
                    <div class="small muted">{{ p.brand || '—' }}</div>
                  </td>
                  <td class="qty" [class.qty-neg]="p.stock <= 0">{{ p.stock }}</td>
                  <td>{{ p.minStock }}</td>
                  <td>
                    <span [class]="'chip ' + stockClass(p)">{{ stockLabel(p) }}</span>
                  </td>
                  <td>Bs {{ p.costPrice | number: '1.2-2' }}</td>
                  <td>Bs {{ p.salePrice | number: '1.2-2' }}</td>
                  <td>
                    <span class="link">{{ selectedProductId() === p.id ? 'Ocultar kardex' : 'Ver kardex' }}</span>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8">
                    <div class="empty">
                      <div class="icon">📦</div>
                      No hay productos que coincidan con la búsqueda.
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      @if (selectedProductId() !== null) {
        <div class="card">
          <div class="section-head">
            <div>
              <h3>Kardex de producto</h3>
              <p class="muted small">{{ selectedProduct()?.sku }} — {{ selectedProduct()?.name }}</p>
            </div>
            <button class="btn btn-ghost btn-sm" (click)="selectedProductId.set(null)">Cerrar</button>
          </div>
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
                      <span [class]="'chip ' + movementClass(m.movementType)">{{ m.movementType }}</span>
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
                        Sin movimientos registrados
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
              <button (click)="loadKardex(meta().page + 1)" [disabled]="meta().page >= meta().totalPages">›</button>
            </div>
          </div>
        </div>
      }

      @if (canManage()) {
        <div class="card card-pad">
          <h3>Ajuste de stock</h3>
          <p class="muted small">Registrar una entrada (positiva) o salida (negativa) manual de existencias</p>
          <form (ngSubmit)="submitAdjust()" novalidate [class.submitted]="submitted()">
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
    .toolbar {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .search {
      max-width: 300px;
    }
    .filter {
      max-width: 160px;
    }
    .product-row {
      cursor: pointer;
    }
    .product-row.selected {
      background: var(--primary-soft);
    }
    .qty {
      font-weight: 650;
    }
    .qty-neg {
      color: var(--danger);
    }
    .qty-pos {
      color: var(--success);
    }
    .link {
      color: var(--primary);
      font-size: 13px;
    }
    .value.danger {
      color: var(--danger);
    }
    .pagination {
      border-top: 1px solid var(--border);
    }
    @media (max-width: 700px) {
      .toolbar {
        flex-direction: column;
        align-items: stretch;
        width: 100%;
      }
      .search,
      .filter {
        max-width: none;
      }
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
  submitted = signal(false);

  q = '';
  stockFilter = 'all';

  formProductId: number | null = null;
  movementType = 'ADJUST';
  quantity: number | null = null;
  concept = '';

  readonly totalUnits = computed(() =>
    this.products().reduce((a, p) => a + Number(p.stock) || 0, 0),
  );

  readonly totalValue = computed(() =>
    this.products().reduce((a, p) => a + (Number(p.stock) || 0) * (Number(p.costPrice) || 0), 0),
  );

  readonly selectedProduct = computed(() =>
    this.products().find((p) => p.id === this.selectedProductId()),
  );

  readonly filteredProducts = computed(() => {
    const query = this.q.trim().toLowerCase();
    return this.products()
      .filter((p) => {
        if (query) {
          const hay =
            `${p.sku} ${p.name} ${p.brand ?? ''} ${p.oemCode ?? ''}`.toLowerCase();
          if (!hay.includes(query)) return false;
        }
        if (this.stockFilter === 'ok') return p.stock > 0;
        if (this.stockFilter === 'low') return p.stock > 0 && p.stock <= p.minStock;
        if (this.stockFilter === 'out') return p.stock <= 0;
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  });

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

  applyFilter(): void {
    /* señal computada; este método solo fuerza re-render del binding */
  }

  selectProduct(p: Product): void {
    if (this.selectedProductId() === p.id) {
      this.selectedProductId.set(null);
      return;
    }
    this.selectedProductId.set(p.id);
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

  stockClass(p: Product): string {
    if (p.stock <= 0) return 'chip-danger';
    if (p.stock <= p.minStock) return 'chip-warning';
    return 'chip-success';
  }

  stockLabel(p: Product): string {
    if (p.stock <= 0) return 'Agotado';
    if (p.stock <= p.minStock) return 'Stock bajo';
    return 'OK';
  }

  async submitAdjust(): Promise<void> {
    const productId = this.formProductId;
    if (productId === null) {
      this.submitted.set(true);
      this.toast.error('Seleccione un producto');
      return;
    }
    if (
      this.quantity === null ||
      this.quantity === undefined ||
      Number.isNaN(Number(this.quantity))
    ) {
      this.submitted.set(true);
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
      this.quantity = null;
      this.concept = '';
      this.submitted.set(false);
      this.loadProducts();
      this.loadLowStock();
      if (this.selectedProductId() !== null) this.loadKardex(1);
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
