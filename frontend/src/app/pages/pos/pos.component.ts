import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { Product, SaleDocument } from '../../core/models';

interface CartLine {
  product: Product;
  qty: number;
}

@Component({
  selector: 'app-pos',
  imports: [FormsModule, CommonModule],
  template: `
    <div class="pos">
      <div class="pos-left">
        <div class="card pos-top-panel">
          <div class="pos-search-bar">
            <input
              class="input search"
              placeholder="Buscar SKU, OEM, código de barras o nombre…"
              [(ngModel)]="search"
              (keyup.enter)="doSearch()"
            />
            <button class="btn btn-primary" type="button" (click)="doSearch()">Buscar</button>
          </div>

          <div class="filter-row">
            <div class="field inline">
              <label>Marca</label>
              <select class="select" [(ngModel)]="brand" name="brand">
                <option value="">Todas</option>
                @for (b of brands(); track b) {
                  <option [value]="b">{{ b }}</option>
                }
              </select>
            </div>
            <div class="field inline">
              <label>Categoría</label>
              <select class="select" [(ngModel)]="category" name="category">
                <option value="">Todas</option>
                @for (c of categories(); track c) {
                  <option [value]="c">{{ c }}</option>
                }
              </select>
            </div>
            <div class="field inline">
              <label>Stock</label>
              <select class="select" [(ngModel)]="availability" name="availability">
                <option value="all">Todos</option>
                <option value="in-stock">Solo disponibles</option>
              </select>
            </div>
            <button class="btn btn-ghost" type="button" (click)="clearFilters()">Limpiar filtros</button>
          </div>
        </div>

        <div class="product-grid">
          @if (filteredProducts().length) {
            @for (product of filteredProducts(); track product.id) {
              <div class="product-card">
                <div
                  class="product-image"
                  [style.background-image]="product.imageUrl ? 'url(' + product.imageUrl + ')' : 'url(/assets/product-placeholder.png)'"
                ></div>
                <div class="product-body">
                  <div class="product-title">{{ product.name }}</div>
                  <div class="product-meta">{{ product.sku }} · {{ product.brand || 'Marca' }}</div>
                  <div class="product-price">Bs {{ product.salePrice | number: '1.2-2' }}</div>
                  <div class="product-stock" [class.out-of-stock]="product.stock <= 0">
                    {{ product.stock > 0 ? 'Stock ' + product.stock : 'Agotado' }}
                  </div>
                  <div class="product-actions">
                    <button class="btn btn-secondary btn-sm" type="button" (click)="add(product)" [disabled]="product.stock <= 0">
                      Agregar
                    </button>
                    <button class="btn btn-primary btn-sm" type="button" (click)="sellNow(product)" [disabled]="product.stock <= 0">
                      Vender ahora
                    </button>
                  </div>
                </div>
              </div>
            }
          } @else {
            <div class="empty-card">
              <div class="icon">🔎</div>
              @if (searched()) {
                No se encontraron productos con estos criterios.
              } @else {
                Busca o filtra productos para verlos aquí.
              }
            </div>
          }
        </div>
      </div>

      <div class="pos-right">
        <div class="card">
          <div class="cart-head">
            <h3>Ticket de venta</h3>
            <span class="muted small">{{ cart().length }} líneas</span>
          </div>

          @if (cart().length === 0) {
            <div class="empty">
              <div class="icon">🛒</div>
              Agrega productos desde las tarjetas para comenzar.
            </div>
          }

          <div class="cart-lines">
            @for (line of cart(); track line.product.id) {
              <div class="line">
                <div class="line-info">
                  <strong>{{ line.product.name }}</strong>
                  <div class="small muted">Bs {{ line.product.salePrice }} c/u</div>
                </div>
                <div class="line-ops">
                  <button class="btn btn-ghost btn-xs" (click)="setQty(line, line.qty - 1)">−</button>
                  <span class="qty">{{ line.qty }}</span>
                  <button class="btn btn-ghost btn-xs" (click)="setQty(line, line.qty + 1)">+</button>
                  <button class="btn btn-ghost btn-xs" (click)="remove(line.product.id)">✕</button>
                </div>
                <span class="line-total">Bs {{ num(line.product.salePrice) * line.qty | number: '1.2-2' }}</span>
              </div>
            }
          </div>

          <div class="totals">
            <div class="t-row">
              <span>Subtotal</span><span>Bs {{ subtotal() | number: '1.2-2' }}</span>
            </div>
            <div class="t-row">
              <span>IVA ({{ taxRate }}%)</span><span>Bs {{ taxAmount() | number: '1.2-2' }}</span>
            </div>
            <div class="t-row total">
              <span>Total</span><span>Bs {{ total() | number: '1.2-2' }}</span>
            </div>
          </div>

          <div class="form-grid" style="padding: 0 14px">
            <div class="field">
              <label>Cliente</label>
              <input class="input" [(ngModel)]="customerName" name="customerName" placeholder="Cliente de contado" />
            </div>
            <div class="field">
              <label>Tipo de documento</label>
              <select class="select" [(ngModel)]="docType" name="docType">
                <option value="NOTA">Nota de venta</option>
                <option value="FACTURA">Factura</option>
              </select>
            </div>
          </div>

          <div class="checkout">
            <button class="btn btn-primary btn-block" (click)="checkout()" [disabled]="cart().length === 0 || busy()">
              {{ busy() ? 'Procesando…' : 'Cobrar y registrar venta' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    .pos {
      display: grid;
      grid-template-columns: 1.2fr 400px;
      gap: 18px;
      padding: 16px;
      min-height: calc(100vh - var(--topbar-height));
    }
    @media (max-width: 1080px) {
      .pos {
        grid-template-columns: 1fr;
      }
    }
    .pos-left {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .pos-top-panel {
      display: grid;
      gap: 12px;
      padding: 16px;
    }
    .pos-search-bar {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 12px;
      align-items: center;
    }
    .search {
      width: 100%;
      min-height: 44px;
      padding: 0 14px;
      border-radius: 12px;
      border: 1px solid var(--border);
      background: var(--surface);
    }
    .filter-row {
      display: grid;
      grid-template-columns: repeat(4, minmax(150px, 1fr));
      gap: 12px;
      align-items: end;
    }
    .field.inline {
      display: grid;
      gap: 6px;
    }
    .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
    }
    .product-card {
      display: flex;
      flex-direction: column;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
      background: var(--surface);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .product-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 16px 40px rgba(6, 24, 98, 0.05);
    }
    .product-image {
      min-height: 160px;
      background-size: cover;
      background-position: center;
    }
    .product-body {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 16px;
    }
    .product-title {
      font-weight: 700;
      line-height: 1.2;
    }
    .product-meta {
      font-size: 13px;
      color: var(--text-secondary);
    }
    .product-price {
      font-size: 18px;
      font-weight: 700;
      color: var(--primary);
    }
    .product-stock {
      font-size: 13px;
      color: var(--success);
    }
    .product-stock.out-of-stock {
      color: var(--danger);
    }
    .product-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-top: auto;
    }
    .btn-sm {
      min-width: 110px;
      padding: 8px 12px;
    }
    .empty-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      min-height: 260px;
      border: 1px dashed var(--border);
      border-radius: var(--radius);
      color: var(--text-secondary);
      padding: 24px;
      background: var(--surface-2);
    }
    .empty-card .icon {
      font-size: 36px;
    }
    .pos-right {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .cart-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 16px;
      border-bottom: 1px solid var(--border);
    }
    .cart-lines {
      max-height: calc(100vh - 460px);
      overflow-y: auto;
      padding: 0 14px 12px;
    }
    .line {
      display: grid;
      grid-template-columns: 1fr auto auto;
      gap: 8px;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px dashed var(--border);
    }
    .line-ops {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .btn-xs {
      padding: 2px 8px;
      font-size: 12px;
      min-width: 26px;
    }
    .qty {
      min-width: 22px;
      text-align: center;
      font-weight: 650;
    }
    .line-total {
      font-weight: 650;
      min-width: 80px;
      text-align: right;
    }
    .totals {
      padding: 16px;
      border-top: 1px solid var(--border);
    }
    .t-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 14px;
    }
    .t-row.total {
      font-size: 17px;
      font-weight: 700;
      border-top: 1px solid var(--border);
      margin-top: 8px;
      padding-top: 10px;
    }
    .checkout {
      padding: 0 14px 14px;
    }
    .btn-block {
      width: 100%;
      justify-content: center;
      padding: 12px;
      font-size: 15px;
    }
  `,
})
export class PosComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  search = '';
  searching = signal(false);
  searched = signal(false);
  results = signal<Product[]>([]);
  cart = signal<CartLine[]>([]);
  customerName = '';
  docType = 'NOTA';
  busy = signal(false);
  taxRate = 16;
  brand = signal('');
  category = signal('');
  availability = signal<'all' | 'in-stock'>('all');

  readonly categories = computed(() =>
    Array.from(new Set(this.results().map((p) => p.category).filter(Boolean) as string[])).sort(),
  );

  readonly brands = computed(() =>
    Array.from(new Set(this.results().map((p) => p.brand).filter(Boolean) as string[])).sort(),
  );

  readonly filteredProducts = computed(() =>
    this.results()
      .filter((product) => {
        if (this.category() && product.category !== this.category()) return false;
        if (this.brand() && product.brand !== this.brand()) return false;
        if (this.availability() === 'in-stock' && product.stock <= 0) return false;
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name)),
  );

  readonly subtotal = computed(() =>
    this.cart().reduce((a, l) => a + l.qty * Number(l.product.basePrice), 0),
  );

  readonly taxAmount = computed(() => (this.subtotal() * this.taxRate) / 100);

  readonly total = computed(() =>
    this.cart().reduce((a, l) => a + l.qty * Number(l.product.salePrice), 0),
  );

  constructor() {
    this.loadTax();
    this.loadProducts();
  }

  private loadTax(): void {
    this.api.get<{ key: string; value: Record<string, unknown> }>('/settings/tax-rate').subscribe({
      next: (s) => {
        const v = Number(s.value?.['value']);
        if (!Number.isNaN(v)) this.taxRate = v;
      },
    });
  }

  private loadProducts(): void {
    this.api.get<{ items: Product[] }>('/products', { page: 1, pageSize: 100 }).subscribe({
      next: (res) => {
        this.results.set(res.items);
      },
    });
  }

  doSearch(): void {
    this.searching.set(false);
    this.searched.set(true);
    this.api
      .get<{ items: Product[] }>('/products', {
        q: this.search || undefined,
        page: 1,
        pageSize: 100,
      })
      .subscribe((res) => {
        this.results.set(res.items);
      });
  }

  clearFilters(): void {
    this.search = '';
    this.brand.set('');
    this.category.set('');
    this.availability.set('all');
    this.doSearch();
  }

  add(p: Product): void {
    const line = this.cart().find((l) => l.product.id === p.id);
    if (line) {
      this.setQty(line, line.qty + 1);
    } else {
      this.cart.set([...this.cart(), { product: p, qty: 1 }]);
    }
  }

  sellNow(p: Product): void {
    if (p.stock <= 0) return;
    this.add(p);
    void this.checkout();
  }

  setQty(line: CartLine, qty: number): void {
    if (qty <= 0) {
      this.remove(line.product.id);
      return;
    }
    if (qty > line.product.stock) {
      this.toast.error(`Stock disponible: ${line.product.stock}`);
      return;
    }
    this.cart.set(this.cart().map((l) => (l.product.id === line.product.id ? { ...l, qty } : l)));
  }

  remove(productId: number): void {
    this.cart.set(this.cart().filter((l) => l.product.id !== productId));
  }

  num(v: unknown): number {
    return Number(v) || 0;
  }

  async checkout(): Promise<void> {
    if (this.cart().length === 0) return;
    this.busy.set(true);
    const payload = {
      docType: this.docType,
      customerName: this.customerName || 'Cliente de contado',
      items: this.cart().map((l) => ({ productId: l.product.id, quantity: l.qty })),
    };
    try {
      const doc = await this.api.post<SaleDocument>('/sales', payload).toPromise();
      if (!doc) return;
      this.toast.success(`Venta ${doc.docNumber} registrada · Total Bs ${doc.total}`);
      this.cart.set([]);
      this.customerName = '';
    } catch {
      /* toast del interceptor */
    } finally {
      this.busy.set(false);
    }
  }
}
