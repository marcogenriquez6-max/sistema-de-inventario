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
          <p class="muted small">
            {{ isEdit() ? 'Actualice los datos del repuesto' : 'Complete los datos del repuesto para registrarlo' }}
          </p>
        </div>
        <a class="btn btn-ghost" routerLink="/catalog">← Volver al catálogo</a>
      </div>

      <form class="card" (ngSubmit)="save()" novalidate [class.submitted]="submitted()">
        <div class="section">
          <div class="section-title">
            <span class="s-icon">🔤</span>
            <div>
              <h3>Identificación</h3>
              <p class="muted small">Datos básicos del repuesto</p>
            </div>
          </div>
          <div class="form-grid">
            <div class="field">
              <label>SKU *</label>
              <input class="input" [(ngModel)]="form().sku" name="sku" placeholder="Ej: BU-003" required />
            </div>
            <div class="field">
              <label>Código OEM</label>
              <input class="input" [(ngModel)]="form().oemCode" name="oemCode" placeholder="Código del fabricante" />
            </div>
            <div class="field">
              <label>Nombre *</label>
              <input class="input" [(ngModel)]="form().name" name="name" placeholder="Nombre del repuesto" required />
            </div>
            <div class="field">
              <label>Marca</label>
              <input class="input" [(ngModel)]="form().brand" name="brand" placeholder="Ej: NGK" />
            </div>
            <div class="field">
              <label>Categoría</label>
              <input class="input" [(ngModel)]="form().category" name="category" placeholder="Ej: Encendido" />
            </div>
            <div class="field">
              <label>Unidad</label>
              <input class="input" [(ngModel)]="form().unit" name="unit" placeholder="uds" />
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">
            <span class="s-icon">💰</span>
            <div>
              <h3>Precios</h3>
              <p class="muted small">IVA de {{ taxRate }}% incluido en el PVP final</p>
            </div>
            <button type="button" class="btn btn-ghost btn-sm auto-btn" (click)="autoCalcPrice()">
              Calcular PVP con IVA
            </button>
          </div>
          <div class="form-grid">
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
                (input)="onBasePrice()"
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
          </div>
        </div>

        <div class="section">
          <div class="section-title">
            <span class="s-icon">📦</span>
            <div>
              <h3>Stock</h3>
              <p class="muted small">Existencias iniciales y punto de reposición</p>
            </div>
          </div>
          <div class="form-grid">
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
                placeholder="Ej: 10"
              />
            </div>
          </div>
        </div>


        <div class="form-actions">
          <a class="btn btn-ghost" routerLink="/catalog">Cancelar</a>
          <button class="btn btn-primary" type="submit" [disabled]="saving()">
            {{ saving() ? 'Guardando…' : isEdit() ? 'Guardar cambios' : 'Crear producto' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: `
    .section {
      padding: 20px;
      border-bottom: 1px solid var(--border);
    }
    .section:last-of-type {
      border-bottom: none;
    }
    .section-title {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    .section-title h3 {
      margin: 0;
    }
    .section-title p {
      margin: 0;
    }
    .s-icon {
      width: 38px;
      height: 38px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--primary-soft);
      border-radius: 10px;
      font-size: 18px;
    }
    .auto-btn {
      margin-left: auto;
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 18px 20px;
      background: var(--surface-2);
      border-radius: 0 0 var(--radius) var(--radius);
    }
    @media (max-width: 560px) {
      .section {
        padding: 16px;
      }
      .section-title {
        flex-wrap: wrap;
      }
      .auto-btn {
        margin-left: 0;
      }
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
    name: '',
    brand: '',
    category: '',
    unit: 'uds',
    costPrice: 0,
    basePrice: 0,
    salePrice: 0,
    stock: 0,
    minStock: 0,
  });
  isEdit = signal(false);
  saving = signal(false);
  submitted = signal(false);
  taxRate = 16;

  constructor() {
    this.loadTax();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.api.get<Product>(`/products/${id}`).subscribe((p) =>
        this.form.set({
          id: p.id,
          sku: p.sku,
          oemCode: p.oemCode ?? '',
          name: p.name,
          brand: p.brand ?? '',
          category: p.category ?? '',
          unit: p.unit,
          costPrice: Number(p.costPrice),
          basePrice: Number(p.basePrice),
          salePrice: Number(p.salePrice),
          stock: p.stock,
          minStock: p.minStock,
        }),
      );
    }
  }

  private loadTax(): void {
    this.api.get<{ key: string; value: Record<string, unknown> }>('/settings/tax-rate').subscribe({
      next: (s) => {
        const v = Number(s.value?.['value']);
        if (!Number.isNaN(v)) this.taxRate = v;
      },
    });
  }

  onBasePrice(): void {
    this.autoCalcPrice();
  }

  autoCalcPrice(): void {
    const f = this.form();
    const base = Number(f.basePrice) || 0;
    const sale = Math.round(base * (1 + this.taxRate / 100) * 100) / 100;
    this.form.set({ ...f, salePrice: sale });
  }

  async save(): Promise<void> {
    const f = this.form();
    if (!f.sku.trim() || !f.name.trim()) {
      this.submitted.set(true);
      this.toast.error('Complete los campos obligatorios: SKU y nombre (marcados en rojo)');
      return;
    }
    this.saving.set(true);
    const payload = {
      sku: f.sku,
      oemCode: f.oemCode || undefined,
      name: f.name,
      brand: f.brand || undefined,
      category: f.category || undefined,
      unit: f.unit,
      costPrice: f.costPrice,
      basePrice: f.basePrice || undefined,
      salePrice: f.salePrice,
      stock: f.stock,
      minStock: f.minStock,
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
