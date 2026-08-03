import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Paginated, Product } from '../../core/models';
import { StatusChipComponent } from '../../shared/status-chip.component';
import { ExportButtonComponent } from '../../shared/export-button.component';

@Component({
  selector: 'app-catalog-list',
  imports: [FormsModule, RouterLink, StatusChipComponent, CommonModule, ExportButtonComponent],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Catálogo de productos</h1>
          <p class="muted small">Repuestos con multicódigo (SKU / OEM / código de barras)</p>
        </div>
        @if (canEdit()) {
          <a class="btn btn-primary" routerLink="/catalog/new">+ Nuevo producto</a>
        }
        <app-export-button resource="products" [params]="{ q: q }" />
      </div>

      <div class="card">
        <div class="toolbar">
          <input
            class="input search"
            placeholder="Buscar por SKU, OEM, código o nombre…"
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
                <th>SKU</th>
                <th>Producto</th>
                <th>Marca</th>
                <th>Categoría</th>
                <th>Stock</th>
                <th>Costo</th>
                <th>PVP</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (p of items(); track p.id) {
                <tr>
                  <td class="mono">{{ p.sku }}</td>
                  <td>
                    <strong>{{ p.name }}</strong>
                    @if (p.oemCode) {
                      <div class="small muted">OEM {{ p.oemCode }}</div>
                    }
                  </td>
                  <td>{{ p.brand }}</td>
                  <td>{{ p.category }}</td>
                  <td>
                    <span [class]="p.stock <= p.minStock ? 'text-warn' : ''">
                      {{ p.stock }}
                    </span>
                    <span class="small muted">/ {{ p.minStock }}</span>
                  </td>
                  <td>Bs {{ p.costPrice | number: '1.2-2' }}</td>
                  <td>
                    <strong>Bs {{ p.salePrice | number: '1.2-2' }}</strong>
                  </td>
                  <td><app-status-chip [value]="p.isActive ? 'TRUE' : 'FALSE'" /></td>
                  <td>
                    <a class="btn btn-ghost btn-sm" [routerLink]="['/catalog', p.id]">Editar</a>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="9">
                    <div class="empty">
                      <div class="icon">🔍</div>
                      Sin resultados
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="pagination">
          <span>{{ meta().totalItems }} productos</span>
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
    .btn-sm {
      padding: 4px 10px;
      font-size: 12.5px;
    }
    .text-warn {
      color: var(--warning);
      font-weight: 650;
    }
  `,
})
export class CatalogListComponent {
  private api = inject(ApiService);
  readonly canEdit = computed(() => this.auth.hasRole('ADMIN', 'INVENTORY_MANAGER'));

  items = signal<Product[]>([]);
  meta = signal({ page: 1, pageSize: 20, totalItems: 0, totalPages: 0 });
  q = '';

  constructor(private auth: AuthService) {
    this.load(1);
  }

  load(page: number): void {
    this.api
      .get<Paginated<Product>>('/products', { page, pageSize: 20, q: this.q || undefined })
      .subscribe((res) => {
        this.items.set(res.items);
        this.meta.set(res.meta);
      });
  }

  reset(): void {
    this.q = '';
    this.load(1);
  }
}
