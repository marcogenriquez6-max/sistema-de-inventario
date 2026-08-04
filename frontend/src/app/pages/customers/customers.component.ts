import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { Customer, Paginated } from '../../core/models';
import { StatusChipComponent } from '../../shared/status-chip.component';
import { ExportButtonComponent } from '../../shared/export-button.component';

interface CustomerForm {
  id: number;
  name: string;
  documentType: string;
  documentNumber: string;
  email: string;
  phone: string;
  address: string;
}

function emptyForm(): CustomerForm {
  return {
    id: 0,
    name: '',
    documentType: '',
    documentNumber: '',
    email: '',
    phone: '',
    address: '',
  };
}

@Component({
  selector: 'app-customers',
  imports: [FormsModule, StatusChipComponent, ExportButtonComponent],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Clientes</h1>
          <p class="muted small">Catálogo de clientes y su información de contacto</p>
        </div>
        <button class="btn btn-primary" (click)="openNew()">+ Nuevo cliente</button>
        <app-export-button resource="customers" [params]="{ q: q }" />
      </div>

      <div class="card">
        <div class="toolbar">
          <input
            class="input search"
            placeholder="Buscar por nombre o código…"
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
                <th>Documento</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (c of items(); track c.id) {
                <tr>
                  <td class="mono">{{ c.code }}</td>
                  <td>
                    <strong>{{ c.name }}</strong>
                  </td>
                  <td>{{ docText(c) }}</td>
                  <td>{{ c.email || '—' }}</td>
                  <td>{{ c.phone || '—' }}</td>
                  <td><app-status-chip [value]="c.isActive ? 'TRUE' : 'FALSE'" /></td>
                  <td>
                    <div class="actions">
                      <button class="btn btn-ghost btn-sm" (click)="openEdit(c)">Editar</button>
                      @if (c.isActive) {
                        <button class="btn btn-ghost btn-sm" (click)="deactivate(c)">
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
                      <div class="icon">👥</div>
                      Sin clientes
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="pagination">
          <span>{{ meta().totalItems }} clientes</span>
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
          <h3>{{ editing() ? 'Editar cliente' : 'Nuevo cliente' }}</h3>
          <form #f="ngForm" (ngSubmit)="save(f)" novalidate [class.submitted]="submitted()">
            <div class="form-grid">
              <div class="field">
                <label>Nombre *</label>
                <input class="input" name="name" [(ngModel)]="form().name" required />
              </div>
              <div class="field">
                <label>Tipo de documento</label>
                <select class="select" name="documentType" [(ngModel)]="form().documentType">
                  <option value="">—</option>
                  <option value="CI">Cédula (CI)</option>
                  <option value="NIT">NIT</option>
                  <option value="RUC">RUC</option>
                  <option value="PASSPORT">Pasaporte</option>
                </select>
              </div>
              <div class="field">
                <label>Nº de carnet</label>
                <input class="input" name="documentNumber" [(ngModel)]="form().documentNumber" placeholder="Ej: 12345678" />
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
              <button type="submit" class="btn btn-primary" [disabled]="saving()">
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
export class CustomersComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  items = signal<Customer[]>([]);
  meta = signal({ page: 1, pageSize: 20, totalItems: 0, totalPages: 0 });
  q = '';

  modalOpen = signal(false);
  editing = signal(false);
  saving = signal(false);
  submitted = signal(false);
  form = signal<CustomerForm>(emptyForm());

  constructor() {
    this.load(1);
  }

  load(page: number): void {
    this.api
      .get<Paginated<Customer>>('/customers', { page, pageSize: 20, q: this.q || undefined })
      .subscribe((res) => {
        this.items.set(res.items);
        this.meta.set(res.meta);
      });
  }

  reset(): void {
    this.q = '';
    this.load(1);
  }

  docText(c: Customer): string {
    if (c.documentType && c.documentNumber) {
      return `${c.documentType} ${c.documentNumber}`;
    }
    return c.documentNumber || c.documentType || '—';
  }

  openNew(): void {
    this.form.set(emptyForm());
    this.editing.set(false);
    this.submitted.set(false);
    this.modalOpen.set(true);
  }

  openEdit(c: Customer): void {
    this.form.set({
      id: c.id,
      name: c.name,
      documentType: c.documentType ?? '',
      documentNumber: c.documentNumber ?? '',
      email: c.email ?? '',
      phone: c.phone ?? '',
      address: c.address ?? '',
    });
    this.editing.set(true);
    this.submitted.set(false);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  async save(f: NgForm): Promise<void> {
    if (!f.valid) {
      this.submitted.set(true);
      this.toast.error('Complete los campos obligatorios (marcados en rojo)');
      return;
    }
    this.saving.set(true);
    const fm = this.form();
    const payload = {
      name: fm.name,
      documentType: fm.documentType || undefined,
      documentNumber: fm.documentNumber || undefined,
      email: fm.email || undefined,
      phone: fm.phone || undefined,
      address: fm.address || undefined,
    };
    try {
      if (this.editing()) {
        await this.api.patch(`/customers/${fm.id}`, payload).toPromise();
        this.toast.success('Cliente actualizado');
      } else {
        await this.api.post('/customers', payload).toPromise();
        this.toast.success('Cliente creado');
      }
      this.closeModal();
      this.load(this.meta().page);
    } catch {
      /* toast del interceptor */
    } finally {
      this.saving.set(false);
    }
  }

  async deactivate(c: Customer): Promise<void> {
    if (!confirm(`¿Desactivar el cliente "${c.name}" (${c.code})?`)) return;
    try {
      await this.api.patch(`/customers/${c.id}`, { isActive: false }).toPromise();
      this.toast.success('Cliente desactivado');
      this.load(this.meta().page);
    } catch {
      /* toast del interceptor */
    }
  }
}
