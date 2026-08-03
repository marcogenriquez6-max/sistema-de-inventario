import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { Product } from '../../core/models';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-product-form',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>{{ isEdit() ? 'Editar producto' : 'Nuevo producto' }}</h1>
          <p class="muted small">{{ isEdit() ? form().sku : 'Complete los datos del repuesto' }}</p>
        </div>
        <a class="btn btn-ghost" routerLink="/catalog">← Volver</a>
      </div>

      <form class="card card-pad" (ngSubmit)="save()">
        <div class="form-grid">
          <div class="field">
            <label>SKU *</label>
            <input class="input" [(ngModel)]="form().sku" name="sku" required />
          </div>
          <div class="field">
            <label>Código OEM</label>
            <input class="input" [(ngModel)]="form().oemCode" name="oemCode" />
          </div>
          <div class="field">
            <label>Código de barras</label>
            <input class="input" [(ngModel)]="form().barcode" name="barcode" />
          </div>
          <div class="field">
            <label>Nombre *</label>
            <input class="input" [(ngModel)]="form().name" name="name" required />
          </div>
          <div class="field">
            <label>Marca</label>
            <input class="input" [(ngModel)]="form().brand" name="brand" />
          </div>
          <div class="field">
            <label>Categoría</label>
            <input class="input" [(ngModel)]="form().category" name="category" />
          </div>
          <div class="field">
            <label>Unidad</label>
            <input class="input" [(ngModel)]="form().unit" name="unit" />
          </div>
          <div class="field">
            <label>Costo (Bs) *</label>
            <input
              class="input"
              type="number"
              step="0.01"
              min="0"
              [(ngModel)]="form().costPrice"
              name="costPrice"
              required
            />
          </div>
          <div class="field">
            <label>PVP sin IVA (Bs)</label>
            <input
              class="input"
              type="number"
              step="0.01"
              min="0"
              [(ngModel)]="form().basePrice"
              name="basePrice"
            />
          </div>
          <div class="field">
            <label>PVP final con IVA (Bs)</label>
            <input
              class="input"
              type="number"
              step="0.01"
              min="0"
              [(ngModel)]="form().salePrice"
              name="salePrice"
            />
          </div>
          <div class="field">
            <label>Stock inicial</label>
            <input class="input" type="number" min="0" [(ngModel)]="form().stock" name="stock" />
          </div>
          <div class="field">
            <label>Stock mínimo</label>
            <input
              class="input"
              type="number"
              min="0"
              [(ngModel)]="form().minStock"
              name="minStock"
            />
          </div>
          <div class="field">
            <label>Pasillo</label>
            <input class="input" [(ngModel)]="form().warehouseAisle" name="warehouseAisle" />
          </div>
          <div class="field">
            <label>Estantería</label>
            <input class="input" [(ngModel)]="form().warehouseShelf" name="warehouseShelf" />
          </div>
          <div class="field">
            <label>Nivel</label>
            <input class="input" [(ngModel)]="form().warehouseLevel" name="warehouseLevel" />
          </div>
          <div class="field">
            <label>Casilla</label>
            <input class="input" [(ngModel)]="form().warehouseBin" name="warehouseBin" />
          </div>
        </div>

        <div class="actions">
          <button class="btn btn-ghost" type="button" routerLink="/catalog">Cancelar</button>
          <button class="btn btn-primary" type="submit" [disabled]="saving()">
            {{ saving() ? 'Guardando…' : 'Guardar' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: `
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 8px;
    }
  `,
})
export class ProductFormComponent {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastService);

  form = signal({
    id: 0,
    sku: '',
    oemCode: '',
    barcode: '',
    name: '',
    brand: '',
    category: '',
    unit: 'uds',
    costPrice: 0,
    basePrice: 0,
    salePrice: 0,
    stock: 0,
    minStock: 0,
    warehouseAisle: '',
    warehouseShelf: '',
    warehouseLevel: '',
    warehouseBin: '',
  });
  isEdit = signal(false);
  saving = signal(false);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.api.get<Product>(`/products/${id}`).subscribe((p) =>
        this.form.set({
          id: p.id,
          sku: p.sku,
          oemCode: p.oemCode ?? '',
          barcode: p.barcode ?? '',
          name: p.name,
          brand: p.brand ?? '',
          category: p.category ?? '',
          unit: p.unit,
          costPrice: Number(p.costPrice),
          basePrice: Number(p.basePrice),
          salePrice: Number(p.salePrice),
          stock: p.stock,
          minStock: p.minStock,
          warehouseAisle: p.warehouseAisle ?? '',
          warehouseShelf: p.warehouseShelf ?? '',
          warehouseLevel: p.warehouseLevel ?? '',
          warehouseBin: p.warehouseBin ?? '',
        }),
      );
    }
  }

  async save(): Promise<void> {
    this.saving.set(true);
    const f = this.form();
    const payload = {
      sku: f.sku,
      oemCode: f.oemCode || undefined,
      barcode: f.barcode || undefined,
      name: f.name,
      brand: f.brand || undefined,
      category: f.category || undefined,
      unit: f.unit,
      costPrice: f.costPrice,
      basePrice: f.basePrice || undefined,
      salePrice: f.salePrice,
      stock: f.stock,
      minStock: f.minStock,
      warehouseAisle: f.warehouseAisle || undefined,
      warehouseShelf: f.warehouseShelf || undefined,
      warehouseLevel: f.warehouseLevel || undefined,
      warehouseBin: f.warehouseBin || undefined,
    };
    try {
      if (this.isEdit()) {
        await this.api.patch(`/products/${f.id}`, payload).toPromise();
        this.toast.success('Producto actualizado');
      } else {
        await this.api.post('/products', payload).toPromise();
        this.toast.success('Producto creado');
      }
      this.router.navigate(['/catalog']);
    } catch {
      /* toast del interceptor */
    } finally {
      this.saving.set(false);
    }
  }
}
