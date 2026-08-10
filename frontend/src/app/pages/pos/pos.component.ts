import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { Customer, Product, SaleDocument } from '../../core/models';
import { BsPipe } from '../../shared/bs.pipe';

interface CartLine {
  product: Product;
  qty: number;
}

interface NewCustomerForm {
  name: string;
  documentType: string;
  documentNumber: string;
  phone: string;
}

const DOC_TYPES = [
  { value: 'CI', label: 'Cédula (CI)' },
  { value: 'NIT', label: 'NIT' },
  { value: 'RUC', label: 'RUC' },
  { value: 'PASSPORT', label: 'Pasaporte' },
];

function emptyCustomer(): NewCustomerForm {
  return { name: '', documentType: 'CI', documentNumber: '', phone: '' };
}

const PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="160"><rect width="200" height="160" fill="#eef2f7"/><g fill="none" stroke="#b6c2d4" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"><path d="M60 55h80l14 26v40H46V81z"/><path d="M46 81h108"/><circle cx="80" cy="114" r="8"/><circle cx="128" cy="114" r="8"/></g><text x="100" y="30" font-family="sans-serif" font-size="12" fill="#8fa0b8" text-anchor="middle">SIN FOTO</text></svg>`,
  );

@Component({
  selector: 'app-pos',
  imports: [FormsModule, CommonModule, BsPipe],
  template: `
    <div class="pos page">
      <div class="pos-left">
        <div class="card pos-top-panel">
          <div class="pos-search-bar">
            <input
              class="input search"
              placeholder="Buscar SKU, OEM o nombre…"
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
                  [style.background-image]="cardImage(product)"
                ></div>
                <div class="product-body">
                  <div class="product-title">{{ product.name }}</div>
                  <div class="product-meta">{{ product.sku }} · {{ product.brand || 'Marca' }}</div>
                  <div class="product-price">
                    {{ unitPrice(product) | bs }}
                    <span class="price-tag">{{ taxing() ? 'con IVA' : 'sin IVA' }}</span>
                  </div>
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
                <div class="line-thumb" [style.background-image]="cardImage(line.product)"></div>
                <div class="line-info">
                  <strong>{{ line.product.name }}</strong>
                  <div class="small muted">
                    {{ unitPrice(line.product) | bs }} c/u {{ taxing() ? 'con IVA' : 'sin IVA' }}
                  </div>
                </div>
                <div class="line-ops">
                  <button class="btn btn-ghost btn-xs" (click)="setQty(line, line.qty - 1)">−</button>
                  <span class="qty">{{ line.qty }}</span>
                  <button class="btn btn-ghost btn-xs" (click)="setQty(line, line.qty + 1)">+</button>
                  <button class="btn btn-ghost btn-xs" (click)="remove(line.product.id)">✕</button>
                </div>
                <span class="line-total">{{ lineTotal(line) | bs }}</span>
              </div>
            }
          </div>

          <div class="totals">
            <div class="t-row">
              <span>Subtotal (sin IVA)</span><span>{{ subtotal() | bs }}</span>
            </div>
            @if (taxing()) {
              <div class="t-row">
                <span>IVA ({{ taxRate }}%)</span><span>{{ taxAmount() | bs }}</span>
              </div>
            }
            <div class="t-row total">
              <span>{{ taxing() ? 'Total (con IVA)' : 'Total (sin IVA)' }}</span>
              <span>{{ total() | bs }}</span>
            </div>
            @if (!taxing()) {
              <div class="t-note">Nota de venta sin IVA. Seleccione Factura para cobrar con IVA.</div>
            }
          </div>

          <div class="checkout-body">
            <div class="form-grid">
              <div class="field">
                <label>Tipo de documento</label>
                <select class="select" [ngModel]="docType()" name="docType" (ngModelChange)="docType.set($event)">
                  <option value="NOTA">Nota de venta (sin IVA)</option>
                  <option value="FACTURA">Factura (con IVA)</option>
                </select>
                <div class="small muted">{{ taxing() ? 'La venta se cobrará con IVA incluido.' : 'La venta se cobrará sin IVA.' }}</div>
              </div>
            </div>

            <div class="field">
              <label>Cliente</label>
              @if (selectedCustomer()) {
                <div class="customer-chip">
                  <div class="customer-chip-info">
                    <strong>{{ selectedCustomer()!.name }}</strong>
                    <div class="small muted">{{ docText(selectedCustomer()!) }}</div>
                  </div>
                  <button type="button" class="btn btn-ghost btn-xs" (click)="clearCustomer()">✕</button>
                </div>
              } @else {
                <div class="customer-search">
                  <input
                    class="input"
                    [(ngModel)]="customerQuery"
                    name="customerQuery"
                    placeholder="Buscar por nombre o carnet…"
                    (input)="onCustomerSearch()"
                    (focus)="onCustomerSearch()"
                    (keyup.enter)="pickFirstCustomer()"
                    autocomplete="off"
                  />
                  @if (customerResults().length > 0 || searchedCustomer()) {
                    <div class="customer-dropdown">
                      @for (c of customerResults(); track c.id) {
                        <button type="button" class="dd-item" (click)="selectCustomer(c)">
                          <span class="dd-name">{{ c.name }}</span>
                          <span class="small muted">{{ docText(c) }}</span>
                        </button>
                      }
                      @if (searchedCustomer() && customerResults().length === 0) {
                        <div class="dd-empty">No se encontró ningún cliente con «{{ customerQuery }}»</div>
                      }
                      <button type="button" class="dd-item new" (click)="openAddCustomer()">
                        + Crear cliente nuevo
                      </button>
                    </div>
                  }
                </div>
              }
            </div>

            @if (addingCustomer()) {
              <div class="card quick-add">
                <div class="quick-add-head">
                  <h4>Nuevo cliente</h4>
                  <button type="button" class="btn btn-ghost btn-xs" (click)="addingCustomer.set(false)">✕</button>
                </div>
                <div class="form-grid">
                  <div class="field">
                    <label>Nombre *</label>
                    <input class="input" [(ngModel)]="newCustomer.name" name="ncName" placeholder="Nombre completo" />
                  </div>
                  <div class="field">
                    <label>Tipo de documento</label>
                    <select class="select" [(ngModel)]="newCustomer.documentType" name="ncDocType">
                      @for (t of DOC_TYPES; track t.value) {
                        <option [value]="t.value">{{ t.label }}</option>
                      }
                    </select>
                  </div>
                  <div class="field">
                    <label>Nº de carnet</label>
                    <input class="input" [(ngModel)]="newCustomer.documentNumber" name="ncDocNumber" placeholder="Ej: 12345678" />
                  </div>
                  <div class="field">
                    <label>Teléfono</label>
                    <input class="input" [(ngModel)]="newCustomer.phone" name="ncPhone" placeholder="Ej: 71234567" />
                  </div>
                </div>
                <div class="quick-add-actions">
                  <button type="button" class="btn btn-ghost btn-sm" (click)="addingCustomer.set(false)">Cancelar</button>
                  <button
                    type="button"
                    class="btn btn-primary btn-sm"
                    [disabled]="creatingCustomer() || !newCustomer.name.trim()"
                    (click)="createCustomer()"
                  >
                    {{ creatingCustomer() ? 'Guardando…' : 'Guardar cliente' }}
                  </button>
                </div>
              </div>
            }

            @if (!selectedCustomer()) {
              <div class="field">
                <label>Nombre del cliente (sin registrar)</label>
                <input
                  class="input"
                  [(ngModel)]="walkInName"
                  name="walkInName"
                  placeholder="Cliente de contado"
                />
              </div>
            }

            <div class="form-grid">
              <div class="field">
                <label>Monto recibido (Bs)</label>
                <input
                  class="input"
                  type="number"
                  min="0"
                  step="0.01"
                  [(ngModel)]="received"
                  name="received"
                  (input)="onReceivedInput()"
                />
              </div>
              <div class="field">
                <label>Cambio (Bs)</label>
                <div class="change-display" [class.pos]="change() >= 0">{{ change() | bs }}</div>
              </div>
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

    @if (receipt()) {
      <div class="receipt-backdrop" (click)="closeReceipt()">
        <div class="receipt-modal" (click)="$event.stopPropagation()">
          <div class="receipt-actions">
            <button class="btn btn-primary" (click)="printReceipt()">🖨️ Imprimir ticket</button>
            <button class="btn btn-ghost" (click)="downloadPdf()">📄 Descargar PDF</button>
            <button class="btn btn-ghost" (click)="closeReceipt()">Nueva venta</button>
          </div>

          <div class="receipt" #receiptEl>
            <div class="receipt-head">
              <img class="receipt-logo" src="/logo.jpg" alt="Repuestos ERP" />
              <div class="receipt-brand">Repuestos ERP</div>
              <div class="receipt-subtitle">Sistema de repuestos y accesorios</div>
              <div class="receipt-line">RUC: 0000000000 · Telf: 000-0000</div>
            </div>

            <div class="receipt-rule"></div>

            <div class="receipt-meta">
              <div class="receipt-row"><span>Documento</span><strong>{{ receipt()!.docType === 'FACTURA' ? 'FACTURA' : 'NOTA DE VENTA' }} {{ receipt()!.docNumber }}</strong></div>
              <div class="receipt-row"><span>Fecha</span><span>{{ receipt()!.createdAt | date: 'dd/MM/yyyy HH:mm' }}</span></div>
              <div class="receipt-row"><span>Atendido por</span><span>{{ cashierName() }}</span></div>
              <div class="receipt-row"><span>Cliente</span><span>{{ receipt()!.customerName }}</span></div>
              @if (receipt()!.customerDoc) {
                <div class="receipt-row"><span>Carnet</span><span>{{ receipt()!.customerDoc }}</span></div>
              }
            </div>

            <div class="receipt-rule"></div>

            <div class="receipt-items">
              <div class="r-head">
                <span>Descripción</span>
                <span>Cant</span>
                <span>P/U</span>
                <span>Total</span>
              </div>
              @for (it of receipt()!.items; track it.id) {
                <div class="r-item">
                  <span class="r-name-wrap">
                    <img class="r-img" [src]="imgFor(it.productId)" alt="" />
                    <span class="r-name">{{ it.productName }}</span>
                  </span>
                  <span>{{ it.quantity }}</span>
                  <span>{{ it.unitSale | bs }}</span>
                  <span class="r-total">{{ it.lineTotal | bs }}</span>
                </div>
              }
            </div>

            <div class="receipt-rule"></div>

            <div class="receipt-totals">
              <div class="r-row"><span>Subtotal</span><span>{{ receipt()!.subtotal | bs }}</span></div>
              @if (receipt()!.docType === 'FACTURA') {
                <div class="r-row"><span>IVA ({{ receipt()!.taxRate }}%)</span><span>{{ receipt()!.taxAmount | bs }}</span></div>
              }
              <div class="r-row r-total-row"><span>TOTAL {{ receipt()!.docType === 'FACTURA' ? '(con IVA)' : '(sin IVA)' }}</span><span>{{ receipt()!.total | bs }}</span></div>
              @if (received() > 0) {
                <div class="r-row"><span>Recibido</span><span>{{ received() | bs }}</span></div>
                <div class="r-row"><span>Cambio</span><span>{{ change() | bs }}</span></div>
              }
            </div>

            <div class="receipt-rule"></div>

            <div class="receipt-foot">
              ¡Gracias por su compra!
              <br />
              @if (receipt()!.docType === 'FACTURA') {
                Documento con IVA incluido.
              } @else {
                Documento sin IVA · No es factura fiscal.
              }
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .pos {
      display: grid;
      grid-template-columns: 1.2fr 400px;
      gap: 18px;
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
    @media (max-width: 700px) {
      .filter-row {
        grid-template-columns: 1fr 1fr;
      }
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
      box-shadow: var(--shadow-md);
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
    .price-tag {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-secondary);
      margin-left: 4px;
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
      grid-template-columns: 44px 1fr auto auto;
      gap: 8px;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px dashed var(--border);
    }
    .line-thumb {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-sm);
      background-size: cover;
      background-position: center;
      background-color: var(--surface-2);
      border: 1px solid var(--border);
    }
    .line-info {
      min-width: 0;
    }
    .line-info strong {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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
    .t-note {
      margin-top: 8px;
      font-size: 12px;
      color: var(--text-secondary);
      background: var(--surface-2);
      border: 1px dashed var(--border);
      border-radius: var(--radius-sm);
      padding: 6px 8px;
    }
    .checkout-body {
      padding: 0 16px 8px;
      border-top: 1px solid var(--border);
    }
    .customer-chip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      border: 1px solid var(--border);
      background: var(--surface-2);
      border-radius: var(--radius-sm);
      padding: 8px 10px;
    }
    .customer-chip-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .customer-search {
      position: relative;
    }
    .customer-dropdown {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      box-shadow: var(--shadow-md);
      z-index: 40;
      overflow: hidden;
      max-height: 240px;
      overflow-y: auto;
    }
    .dd-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
      width: 100%;
      text-align: left;
      padding: 8px 12px;
      border: none;
      background: transparent;
      color: var(--text);
      font-size: 13.5px;
      cursor: pointer;
      font-family: inherit;
    }
    .dd-item:hover {
      background: var(--surface-hover);
    }
    .dd-item.new {
      color: var(--primary);
      font-weight: 600;
      border-top: 1px solid var(--border);
    }
    .dd-empty {
      padding: 10px 12px;
      color: var(--text-secondary);
      font-size: 13px;
    }
    .quick-add {
      padding: 14px;
      margin: 4px 0 12px;
    }
    .quick-add-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .quick-add h4 {
      margin: 0;
    }
    .quick-add-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    .change-display {
      padding: 9px 11px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      background: var(--surface-2);
      font-weight: 700;
      font-size: 14px;
    }
    .change-display.pos {
      color: var(--success);
    }
    .checkout {
      padding: 0 16px 16px;
    }
    .btn-block {
      width: 100%;
      justify-content: center;
      padding: 12px;
      font-size: 15px;
    }

    /* ---- Ticket / recibo ---- */
    .receipt-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(10, 15, 25, 0.55);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .receipt-modal {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: calc(100vh - 32px);
      overflow: auto;
    }
    .receipt-actions {
      display: flex;
      justify-content: center;
      gap: 10px;
    }
    .receipt {
      width: 300px;
      background: #fff;
      color: #111;
      font-family: 'Cascadia Code', Consolas, 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.5;
      padding: 18px 16px;
      border-radius: 8px;
      box-shadow: var(--shadow-md);
    }
    .receipt-head {
      text-align: center;
    }
    .receipt-logo {
      width: 64px;
      height: 64px;
      object-fit: contain;
      margin-bottom: 4px;
    }
    .receipt-brand {
      font-weight: 800;
      font-size: 15px;
      letter-spacing: 0.02em;
    }
    .receipt-subtitle {
      font-size: 11px;
      color: #444;
    }
    .receipt-line {
      font-size: 11px;
      color: #555;
    }
    .receipt-rule {
      border-top: 1px dashed #666;
      margin: 10px 0;
    }
    .receipt-row {
      display: flex;
      justify-content: space-between;
      gap: 8px;
    }
    .receipt-row strong {
      text-align: right;
    }
    .r-head,
    .r-item {
      display: grid;
      grid-template-columns: 1fr auto auto auto;
      gap: 8px;
    }
    .r-head {
      font-weight: 700;
      border-bottom: 1px dashed #999;
      padding-bottom: 4px;
      margin-bottom: 4px;
    }
    .r-item {
      padding: 1px 0;
    }
    .r-name-wrap {
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
    }
    .r-img {
      width: 26px;
      height: 26px;
      border-radius: 4px;
      object-fit: cover;
      border: 1px solid #ddd;
      background: #f2f2f2;
      flex-shrink: 0;
    }
    .r-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .r-total {
      text-align: right;
      font-weight: 600;
    }
    .r-row {
      display: flex;
      justify-content: space-between;
      padding: 1px 0;
    }
    .r-total-row {
      font-weight: 800;
      font-size: 14px;
      border-top: 1px dashed #666;
      margin-top: 4px;
      padding-top: 4px;
    }
    .receipt-foot {
      text-align: center;
      font-size: 11px;
      color: #333;
    }
  `,
})
export class PosComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private auth = inject(AuthService);

  search = '';
  searching = signal(false);
  searched = signal(false);
  results = signal<Product[]>([]);
  cart = signal<CartLine[]>([]);
  docType = signal<'NOTA' | 'FACTURA'>('NOTA');
  busy = signal(false);
  taxRate = 16;
  brand = signal('');
  category = signal('');
  availability = signal<'all' | 'in-stock'>('all');
  private cartImages = new Map<number, string>();

  customerQuery = '';
  customerResults = signal<Customer[]>([]);
  searchedCustomer = signal(false);
  selectedCustomer = signal<Customer | null>(null);
  addingCustomer = signal(false);
  creatingCustomer = signal(false);
  newCustomer = emptyCustomer();
  walkInName = '';

  received = signal(0);
  receipt = signal<SaleDocument | null>(null);

  readonly DOC_TYPES = DOC_TYPES;

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

  readonly taxing = computed(() => this.docType() === 'FACTURA');

  readonly subtotal = computed(() =>
    this.cart().reduce((a, l) => a + l.qty * Number(l.product.basePrice), 0),
  );

  readonly taxAmount = computed(() =>
    this.cart().reduce(
      (a, l) => a + l.qty * this.round2(Number(l.product.salePrice) - Number(l.product.basePrice)),
      0,
    ),
  );

  readonly total = computed(() =>
    this.taxing() ? this.subtotal() + this.taxAmount() : this.subtotal(),
  );

  readonly change = computed(() => Math.max(0, this.received() - this.total()));

  readonly cashierName = computed(() => this.auth.user()?.fullName ?? '');

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
    this.cartImages.set(p.id, p.imageUrl ?? '');
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

  round2(v: number): number {
    return Math.round(v * 100) / 100;
  }

  unitPrice(p: Product): number {
    return this.taxing() ? Number(p.salePrice) : Number(p.basePrice);
  }

  lineTotal(line: CartLine): number {
    return this.round2(this.unitPrice(line.product) * line.qty);
  }

  imageUrl(url: string | null): string {
    if (!url) return '';
    const origin = (window as { __API_ORIGIN__?: string }).__API_ORIGIN__;
    if (origin && url.startsWith('/api/')) return `${origin}${url}`;
    return url;
  }

  cardImage(p: Product): string {
    return `url(${this.imageUrl(p.imageUrl) || PLACEHOLDER})`;
  }

  imgFor(productId: number): string {
    const url = this.cartImages.get(productId);
    return this.imageUrl(url ?? '') || PLACEHOLDER;
  }

  docText(c: Customer): string {
    if (c.documentType && c.documentNumber) return `${c.documentType}: ${c.documentNumber}`;
    return c.documentNumber || c.documentType || 'Sin documento';
  }

  onCustomerSearch(): void {
    const q = this.customerQuery.trim();
    if (q.length < 2) {
      this.customerResults.set([]);
      this.searchedCustomer.set(false);
      return;
    }
    this.api
      .get<{ items: Customer[] }>('/customers', { q, page: 1, pageSize: 10 })
      .subscribe((res) => {
        this.customerResults.set(res.items);
        this.searchedCustomer.set(true);
      });
  }

  pickFirstCustomer(): void {
    const first = this.customerResults()[0];
    if (first) this.selectCustomer(first);
  }

  selectCustomer(c: Customer): void {
    this.selectedCustomer.set(c);
    this.customerQuery = '';
    this.customerResults.set([]);
    this.searchedCustomer.set(false);
    this.addingCustomer.set(false);
  }

  clearCustomer(): void {
    this.selectedCustomer.set(null);
  }

  openAddCustomer(): void {
    this.addingCustomer.set(true);
  }

  async createCustomer(): Promise<void> {
    const name = this.newCustomer.name.trim();
    if (!name) return;
    this.creatingCustomer.set(true);
    const payload = {
      name,
      documentType: this.newCustomer.documentType || undefined,
      documentNumber: this.newCustomer.documentNumber.trim() || undefined,
      phone: this.newCustomer.phone.trim() || undefined,
    };
    try {
      const created = await this.api.post<Customer>('/customers', payload).toPromise();
      if (!created) return;
      this.toast.success(`Cliente "${created.name}" creado`);
      this.newCustomer = emptyCustomer();
      this.addingCustomer.set(false);
      this.selectedCustomer.set(created);
    } catch {
      /* toast del interceptor */
    } finally {
      this.creatingCustomer.set(false);
    }
  }

  onReceivedInput(): void {
    const v = Number(this.received());
    if (Number.isNaN(v)) this.received.set(0);
  }

  async checkout(): Promise<void> {
    if (this.cart().length === 0) return;
    this.busy.set(true);

    const selected = this.selectedCustomer();
    const customerName = selected?.name || this.walkInName.trim() || 'Cliente de contado';
    const customerDoc = selected?.documentNumber || undefined;

    const payload = {
      docType: this.docType(),
      customerName,
      customerDoc,
      items: this.cart().map((l) => ({ productId: l.product.id, quantity: l.qty })),
    };
    try {
      const doc = await this.api.post<{ document: SaleDocument }>('/sales', payload).toPromise();
      if (!doc) return;
      this.toast.success(`Venta ${doc.document.docNumber} registrada · Total Bs ${doc.document.total}`);
      this.receipt.set(doc.document);
      this.cart.set([]);
      this.walkInName = '';
      this.received.set(0);
      this.clearCustomer();
      this.clearFilters();
      setTimeout(() => this.printReceipt(), 400);
    } catch {
      /* toast del interceptor */
    } finally {
      this.busy.set(false);
    }
  }

  printReceipt(): void {
    window.print();
  }

  downloadPdf(): void {
    const doc = this.receipt();
    if (!doc) return;
    this.api.download(`/sales/${doc.id}/pdf`).subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `venta_${doc.docNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  closeReceipt(): void {
    this.receipt.set(null);
  }
}
