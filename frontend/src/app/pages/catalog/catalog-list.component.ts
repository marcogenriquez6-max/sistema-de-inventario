import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Paginated, Product } from '../../core/models';
import { StatusChipComponent } from '../../shared/status-chip.component';
import { ExportButtonComponent } from '../../shared/export-button.component';
import { BsPipe } from '../../shared/bs.pipe';
import { ToastService } from '../../core/services/toast.service';

interface Facets {
  brands: string[];
  categories: string[];
  provenances: string[];
}

@Component({
  selector: 'app-catalog-list',
  imports: [
    FormsModule,
    RouterLink,
    StatusChipComponent,
    CommonModule,
    ExportButtonComponent,
    BsPipe,
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Catálogo de productos</h1>
          <p class="muted small">Repuestos con multicódigo (SKU / OEM / código de barras)</p>
        </div>
        <div class="header-actions">
          @if (canEdit()) {
            <button class="btn btn-ghost" (click)="downloadTemplate()">📄 Plantilla</button>
            <button class="btn btn-ghost" (click)="fileInput.click()">
              {{ importing() ? 'Importando…' : '⬆️ Importar' }}
            </button>
            <input #fileInput type="file" accept=".csv,.xlsx" class="hidden" (change)="onImport($event)" />
            <a class="btn btn-primary" routerLink="/catalog/new">+ Nuevo producto</a>
          }
          <app-export-button resource="products" [params]="exportParams()" />
        </div>
      </div>

      <div class="card">
        <div class="toolbar filters">
          <input
            class="input search"
            placeholder="Buscar por SKU, OEM, código o nombre…"
            [(ngModel)]="filters.q"
            (keyup.enter)="load(1)"
          />

          <select class="input" [(ngModel)]="filters.brand" (ngModelChange)="load(1)">
            <option value="">Marca: todas</option>
            @for (b of facets().brands; track b) {
              <option [value]="b">{{ b }}</option>
            }
          </select>

          <select class="input" [(ngModel)]="filters.category" (ngModelChange)="load(1)">
            <option value="">Categoría: todas</option>
            @for (c of facets().categories; track c) {
              <option [value]="c">{{ c }}</option>
            }
          </select>

          <select class="input" [(ngModel)]="filters.provenance" (ngModelChange)="load(1)">
            <option value="">Procedencia: todas</option>
            @for (pr of facets().provenances; track pr) {
              <option [value]="pr">{{ pr }}</option>
            }
          </select>

          <label class="check">
            <input type="checkbox" [(ngModel)]="filters.lowStock" (ngModelChange)="load(1)" />
            Solo stock bajo
          </label>

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
                <th>Procedencia</th>
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
                    @if (p.provenance) {
                      <span class="chip chip-neutral">{{ p.provenance }}</span>
                    }
                  </td>
                  <td>
                    <span [class]="p.stock <= p.minStock ? 'text-warn' : ''">
                      {{ p.stock }}
                    </span>
                    <span class="small muted">/ {{ p.minStock }}</span>
                  </td>
                  <td>{{ p.costPrice | bs }}</td>
                  <td>
                    <strong>{{ p.salePrice | bs }}</strong>
                  </td>
                  <td><app-status-chip [value]="p.isActive ? 'TRUE' : 'FALSE'" /></td>
                  <td>
                    <a class="btn btn-ghost btn-sm" [routerLink]="['/catalog', p.id]">Editar</a>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="10">
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
    .header-actions {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }
    .hidden {
      display: none;
    }
    .toolbar {
      display: flex;
      gap: 8px;
      padding: 12px;
      border-bottom: 1px solid var(--border);
    }
    .filters {
      flex-wrap: wrap;
      align-items: center;
    }
    .filters .input {
      max-width: 260px;
    }
    .filters .search {
      flex: 1;
      min-width: 220px;
      max-width: 340px;
    }
    .check {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--text-secondary);
      white-space: nowrap;
      cursor: pointer;
    }
    .btn-sm {
      padding: 4px 10px;
      font-size: 12.5px;
    }
    .text-warn {
      color: var(--warning);
      font-weight: 650;
    }
    .chip-neutral {
      font-size: 12px;
    }
  `,
})
export class CatalogListComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  readonly canEdit = computed(() => this.auth.hasRole('ADMIN', 'INVENTORY_MANAGER'));

  items = signal<Product[]>([]);
  meta = signal({ page: 1, pageSize: 20, totalItems: 0, totalPages: 0 });
  facets = signal<Facets>({ brands: [], categories: [], provenances: [] });
  importing = signal(false);
  filters = {
    q: '',
    brand: '',
    category: '',
    provenance: '',
    lowStock: false,
  };

  readonly exportParams = computed(() => ({
    q: this.filters.q || undefined,
    brand: this.filters.brand || undefined,
    category: this.filters.category || undefined,
    provenance: this.filters.provenance || undefined,
    lowStock: this.filters.lowStock ? 1 : undefined,
  }));

  constructor(private auth: AuthService) {
    this.loadFacets();
    this.load(1);
  }

  loadFacets(): void {
    this.api.get<Facets>('/products/facets').subscribe({
      next: (f) => this.facets.set(f),
    });
  }

  load(page: number): void {
    this.api
      .get<Paginated<Product>>('/products', {
        page,
        pageSize: 20,
        q: this.filters.q || undefined,
        brand: this.filters.brand || undefined,
        category: this.filters.category || undefined,
        provenance: this.filters.provenance || undefined,
        lowStock: this.filters.lowStock ? 1 : undefined,
      })
      .subscribe((res) => {
        this.items.set(res.items);
        this.meta.set(res.meta);
      });
  }

  reset(): void {
    this.filters = { q: '', brand: '', category: '', provenance: '', lowStock: false };
    this.loadFacets();
    this.load(1);
  }

  downloadTemplate(): void {
    this.api.download('/products/import-template').subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla_productos.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      },
    });
  }

  onImport(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.importing.set(true);
    this.api
      .upload<{ created: number; updated: number; errors: Array<{ row: number; message: string }> }>(
        '/products/import',
        file,
      )
      .subscribe({
        next: (r) => {
          const created = r?.created ?? 0;
          const updated = r?.updated ?? 0;
          const errors = r?.errors ?? [];
          if (errors.length > 0) {
            this.toast.warning(
              `Importado: ${created} creados, ${updated} actualizados, ${errors.length} con errores`,
            );
          } else {
            this.toast.success(`Importación completa: ${created} creados, ${updated} actualizados`);
          }
          this.loadFacets();
          this.load(1);
        },
        error: () => this.toast.error('No se pudo importar el archivo'),
        complete: () => {
          this.importing.set(false);
          input.value = '';
        },
      });
  }
}
