import { Component, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { Product } from '../../core/models';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';

@Component({
  selector: 'app-product-form',
  imports: [FormsModule, RouterLink, ConfirmDialogComponent],
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
              <label>Procedencia</label>
              <input class="input" [(ngModel)]="form().provenance" name="provenance" placeholder="Ej: Importado, Nacional" />
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
          <div class="field photo-field">
            <label>Foto del producto</label>
            <div class="photo-row">
              <div class="photo-preview">
                @if (form().imageUrl) {
                  <img [src]="resolveImage(form().imageUrl)" alt="Vista previa" />
                } @else {
                  <span class="muted">Sin foto</span>
                }
              </div>
              <div class="photo-actions">
                <button type="button" class="btn btn-ghost btn-sm" (click)="photoInput.click()">
                  {{ submittingPhoto() ? 'Subiendo…' : '📷 Elegir imagen' }}
                </button>
                @if (form().imageUrl) {
                  <button type="button" class="btn btn-ghost btn-sm danger" (click)="clearImage()">
                    Quitar foto
                  </button>
                }
                <input #photoInput type="file" accept="image/*" class="hidden" (change)="onPhoto($event)" />
                <p class="muted small">JPG, PNG, WebP o GIF · máx. 3 MB</p>
              </div>
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
      <app-confirm-dialog #confirm />
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
    .photo-field {
      margin-top: 16px;
    }
    .photo-row {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }
    .photo-preview {
      width: 120px;
      height: 120px;
      border-radius: var(--radius);
      border: 1px dashed var(--border);
      background: var(--surface-2);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex: none;
    }
    .photo-preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .photo-actions {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }
    .photo-actions .danger {
      color: var(--danger);
    }
    .hidden {
      display: none;
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
  private confirm = viewChild(ConfirmDialogComponent);

  form = signal({
    id: 0,
    oemCode: '',
    name: '',
    brand: '',
    category: '',
    provenance: '',
    unit: 'uds',
    costPrice: 0,
    basePrice: 0,
    salePrice: 0,
    stock: 0,
    minStock: 0,
    imageUrl: '',
  });
  isEdit = signal(false);
  saving = signal(false);
  submittingPhoto = signal(false);
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
          oemCode: p.oemCode ?? '',
          name: p.name,
          brand: p.brand ?? '',
          category: p.category ?? '',
          provenance: p.provenance ?? '',
          unit: p.unit,
          costPrice: Number(p.costPrice),
          basePrice: Number(p.basePrice),
          salePrice: Number(p.salePrice),
          stock: p.stock,
          minStock: p.minStock,
          imageUrl: p.imageUrl ?? '',
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

  resolveImage(url: string): string {
    if (!url) return '';
    const origin = (window as { __API_ORIGIN__?: string }).__API_ORIGIN__;
    if (origin && url.startsWith('/api/')) return `${origin}${url}`;
    return url;
  }

  onPhoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.toast.error('Selecciona un archivo de imagen');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      this.toast.error('La imagen supera los 3 MB');
      return;
    }
    this.submittingPhoto.set(true);
    this.api.upload<{ url: string }>('/uploads', file).subscribe({
      next: (res) => {
        if (res?.url) {
          this.form.set({ ...this.form(), imageUrl: res.url });
          this.toast.success('Imagen subida');
        }
      },
      error: () => this.toast.error('No se pudo subir la imagen'),
      complete: () => {
        this.submittingPhoto.set(false);
        input.value = '';
      },
    });
  }

  clearImage(): void {
    this.form.set({ ...this.form(), imageUrl: '' });
  }

  async save(): Promise<void> {
    const f = this.form();
    if (!f.name.trim()) {
      this.submitted.set(true);
      this.toast.error('Complete el nombre del repuesto (marcado en rojo)');
      return;
    }
    const ok = await this.confirm()?.open(
      this.isEdit() ? '¿Guardar cambios?' : '¿Crear producto?',
      'Se guardarán los datos del repuesto. ¿Desea continuar?',
      this.isEdit() ? 'Guardar' : 'Crear',
    );
    if (!ok) return;
    this.saving.set(true);
    const payload = {
      oemCode: f.oemCode || undefined,
      name: f.name,
      brand: f.brand || undefined,
      category: f.category || undefined,
      provenance: f.provenance || undefined,
      unit: f.unit,
      costPrice: f.costPrice,
      basePrice: f.basePrice || undefined,
      salePrice: f.salePrice,
      stock: f.stock,
      minStock: f.minStock,
      imageUrl: f.imageUrl || null,
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
