import { Component, computed, inject, signal, viewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Paginated, Product } from '../../core/models';
import { StatusChipComponent } from '../../shared/status-chip.component';
import { ExportButtonComponent } from '../../shared/export-button.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
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
    ConfirmDialogComponent,
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
            (ngModelChange)="onSearchChange()"
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

          <button class="btn btn-ghost" (click)="reset()">Limpiar</button>
        </div>

        <div class="table-wrap">
          @if (loading()) {
            <div class="loading-bar">Cargando…</div>
          }
          <table class="data">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Producto</th>
                <th>Marca</th>
                <th>Categoría</th>
                <th>Procedencia</th>
                <th>Stock</th>
                <th>Precio sin IVA</th>
                <th>Precio con IVA</th>
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
                  <td>{{ p.basePrice | bs }}</td>
                  <td>
                    <strong>{{ p.salePrice | bs }}</strong>
                  </td>
                  <td><app-status-chip [value]="p.isActive ? 'TRUE' : 'FALSE'" /></td>
                  <td>
                    <div class="row-actions">
                      @if (canEdit()) {
                        <a class="btn btn-ghost btn-sm" [routerLink]="['/catalog', p.id]">Editar</a>
                        <button class="btn btn-ghost btn-sm" (click)="toggleActive(p)">
                          {{ p.isActive ? 'Dar de baja' : 'Reactivar' }}
                        </button>
                      }
                      @if (canDelete()) {
                        <button class="btn btn-ghost btn-sm danger" (click)="removeProduct(p)">Eliminar</button>
                      }
                    </div>
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
      <app-confirm-dialog #confirm />
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
    .row-actions {
      display: flex;
      gap: 6px;
      flex-wrap: nowrap;
      align-items: center;
    }
    .row-actions .btn.danger {
      color: var(--danger);
    }
    .text-warn {
      color: var(--warning);
      font-weight: 650;
    }
    .chip-neutral {
      font-size: 12px;
    }
    .loading-bar {
      padding: 12px;
      text-align: center;
      color: var(--text-secondary);
      font-size: 13px;
      background: var(--surface-2);
      border-bottom: 1px solid var(--border);
    }
  `,
})
export class CatalogListComponent implements OnDestroy {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  readonly canEdit = computed(() => this.auth.hasRole('ADMIN', 'INVENTORY_MANAGER'));
  readonly canDelete = computed(() => this.auth.hasRole('ADMIN'));
  private confirm = viewChild(ConfirmDialogComponent);
  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private loadSub: Subscription | null = null;
  loading = signal(false);

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

  ngOnDestroy(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    if (this.loadSub) this.loadSub.unsubscribe();
  }

  onSearchChange(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.load(1), 350);
  }

  loadFacets(): void {
    this.api.get<Facets>('/products/facets').subscribe({
      next: (f) => this.facets.set(f),
    });
  }

  load(page: number): void {
    if (this.loadSub) this.loadSub.unsubscribe();
    this.loading.set(true);
    this.loadSub = this.api
      .get<Paginated<Product>>('/products', {
        page,
        pageSize: 20,
        q: this.filters.q || undefined,
        brand: this.filters.brand || undefined,
        category: this.filters.category || undefined,
        provenance: this.filters.provenance || undefined,
        lowStock: this.filters.lowStock ? 1 : undefined,
      })
      .subscribe({
        next: (res) => {
          this.items.set(res.items);
          this.meta.set(res.meta);
        },
        complete: () => this.loading.set(false),
      });
  }

  reset(): void {
    this.filters = { q: '', brand: '', category: '', provenance: '', lowStock: false };
    this.loadFacets();
    this.load(1);
  }

  async toggleActive(p: Product): Promise<void> {
    const next = !p.isActive;
    const ok = await this.confirm()?.open(
      next ? 'Reactivar producto' : 'Dar de baja',
      next
        ? `¿Reactivar "${p.name}"?`
        : `¿Dar de baja "${p.name}"? No aparecerá en el POS ni en ventas nuevas.`,
      next ? 'Reactivar' : 'Dar de baja',
    );
    if (!ok) return;
    this.api
      .patch(`/products/${p.id}`, { isActive: next })
      .subscribe({
        next: () => {
          this.toast.success(next ? 'Producto reactivado' : 'Producto dado de baja');
          this.load(1);
          this.loadFacets();
        },
        error: () => this.toast.error('No se pudo cambiar el estado'),
      });
  }

  async removeProduct(p: Product): Promise<void> {
    const ok = await this.confirm()?.open(
      'Eliminar producto',
      `¿Eliminar definitivamente "${p.name}" (${p.sku})? Esta acción no se puede deshacer.`,
      'Eliminar',
    );
    if (!ok) return;
    this.api.delete(`/products/${p.id}`).subscribe({
      next: () => {
        this.toast.success('Producto eliminado');
        this.load(1);
        this.loadFacets();
      },
      error: () => this.toast.error('No se pudo eliminar el producto'),
    });
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
