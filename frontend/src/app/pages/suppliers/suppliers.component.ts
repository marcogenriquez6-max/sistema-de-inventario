import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { Paginated, Supplier } from '../../core/models';
import { StatusChipComponent } from '../../shared/status-chip.component';
import { ExportButtonComponent } from '../../shared/export-button.component';

interface SupplierForm {
  id: number;
  code: string;
  name: string;
  taxId: string;
  email: string;
  phone: string;
  address: string;
}

function emptyForm(): SupplierForm {
  return {
    id: 0,
    code: '',
    name: '',
    taxId: '',
    email: '',
    phone: '',
    address: '',
  };
}

@Component({
  selector: 'app-suppliers',
  imports: [FormsModule, StatusChipComponent, ExportButtonComponent],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Proveedores</h1>
          <p class="muted small">Proveedores de repuestos y sus datos de contacto</p>
        </div>
        <button class="btn btn-primary" (click)="openNew()">+ Nuevo proveedor</button>
        <app-export-button resource="suppliers" [params]="{ q: q }" />
      </div>

      <div class="card">
        <div class="toolbar">
          <input
            class="input search"
            placeholder="Buscar por nombre, código o NIT…"
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
                <th>Código</th>
                <th>Nombre</th>
                <th>NIT</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (s of items(); track s.id) {
                <tr>
                  <td class="mono">{{ s.code }}</td>
                  <td>
                    <strong>{{ s.name }}</strong>
                  </td>
                  <td>{{ s.taxId || '—' }}</td>
                  <td>{{ s.email || '—' }}</td>
                  <td>{{ s.phone || '—' }}</td>
                  <td><app-status-chip [value]="s.isActive ? 'TRUE' : 'FALSE'" /></td>
                  <td>
                    <div class="actions">
                      <button class="btn btn-ghost btn-sm" (click)="openEdit(s)">Editar</button>
                      @if (s.isActive) {
                        <button class="btn btn-ghost btn-sm" (click)="deactivate(s)">
                          Desactivar
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7">
                    <div class="empty">
                      <div class="icon">🏭</div>
                      Sin proveedores
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="pagination">
          <span>{{ meta().totalItems }} proveedores</span>
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

    @if (modalOpen()) {
      <div class="backdrop" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>{{ editing() ? 'Editar proveedor' : 'Nuevo proveedor' }}</h3>
          <form #f="ngForm" (ngSubmit)="save(f)">
            <div class="form-grid">
              <div class="field">
                <label>Código *</label>
                <input class="input" name="code" [(ngModel)]="form().code" required />
              </div>
              <div class="field">
                <label>Nombre *</label>
                <input class="input" name="name" [(ngModel)]="form().name" required />
              </div>
              <div class="field">
                <label>NIT</label>
                <input class="input" name="taxId" [(ngModel)]="form().taxId" />
              </div>
              <div class="field">
                <label>Email</label>
                <input class="input" type="email" name="email" [(ngModel)]="form().email" />
              </div>
              <div class="field">
                <label>Teléfono</label>
                <input class="input" name="phone" [(ngModel)]="form().phone" />
              </div>
              <div class="field">
                <label>Dirección</label>
                <input class="input" name="address" [(ngModel)]="form().address" />
              </div>
            </div>
            <div class="actions">
              <button type="button" class="btn btn-ghost" (click)="closeModal()">Cancelar</button>
              <button type="submit" class="btn btn-primary" [disabled]="saving() || !f.valid">
                {{ saving() ? 'Guardando…' : 'Guardar' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: `
    .toolbar {
      display: flex;
      gap: 8px;
      padding: 12px;
      border-bottom: 1px solid var(--border);
    }
    .search {
      max-width: 320px;
    }
    .actions {
      display: flex;
      gap: 6px;
    }
    .btn-sm {
      padding: 4px 10px;
      font-size: 12.5px;
    }
    .backdrop {
      position: fixed;
      inset: 0;
      background: rgba(10, 15, 25, 0.45);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .modal {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow-md);
      padding: 20px;
      width: min(560px, 100%);
      max-height: calc(100vh - 48px);
      overflow: auto;
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 18px;
    }
  `,
})
export class SuppliersComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  items = signal<Supplier[]>([]);
  meta = signal({ page: 1, pageSize: 20, totalItems: 0, totalPages: 0 });
  q = '';

  modalOpen = signal(false);
  editing = signal(false);
  saving = signal(false);
  form = signal<SupplierForm>(emptyForm());

  constructor() {
    this.load(1);
  }

  load(page: number): void {
    this.api
      .get<Paginated<Supplier>>('/suppliers', { page, pageSize: 20, q: this.q || undefined })
      .subscribe((res) => {
        this.items.set(res.items);
        this.meta.set(res.meta);
      });
  }

  reset(): void {
    this.q = '';
    this.load(1);
  }

  openNew(): void {
    this.form.set(emptyForm());
    this.editing.set(false);
    this.modalOpen.set(true);
  }

  openEdit(s: Supplier): void {
    this.form.set({
      id: s.id,
      code: s.code,
      name: s.name,
      taxId: s.taxId ?? '',
      email: s.email ?? '',
      phone: s.phone ?? '',
      address: s.address ?? '',
    });
    this.editing.set(true);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  async save(f: NgForm): Promise<void> {
    if (!f.valid) return;
    this.saving.set(true);
    const fm = this.form();
    const payload = {
      code: fm.code,
      name: fm.name,
      taxId: fm.taxId || undefined,
      email: fm.email || undefined,
      phone: fm.phone || undefined,
      address: fm.address || undefined,
    };
    try {
      if (this.editing()) {
        await this.api.patch(`/suppliers/${fm.id}`, payload).toPromise();
        this.toast.success('Proveedor actualizado');
      } else {
        await this.api.post('/suppliers', payload).toPromise();
        this.toast.success('Proveedor creado');
      }
      this.closeModal();
      this.load(this.meta().page);
    } catch {
      /* toast del interceptor */
    } finally {
      this.saving.set(false);
    }
  }

  async deactivate(s: Supplier): Promise<void> {
    if (!confirm(`¿Desactivar el proveedor "${s.name}" (${s.code})?`)) return;
    try {
      await this.api.patch(`/suppliers/${s.id}`, { isActive: false }).toPromise();
      this.toast.success('Proveedor desactivado');
      this.load(this.meta().page);
    } catch {
      /* toast del interceptor */
    }
  }
}
