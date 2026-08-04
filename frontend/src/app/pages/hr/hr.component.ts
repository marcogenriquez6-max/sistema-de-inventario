import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { Employee, Paginated } from '../../core/models';
import { StatusChipComponent } from '../../shared/status-chip.component';
import { ExportButtonComponent } from '../../shared/export-button.component';

interface EmployeeForm {
  id: number;
  code: string;
  fullName: string;
  documentNumber: string;
  position: string;
  department: string;
  phone: string;
  email: string;
  hireDate: string;
  salary: number | null;
}

const EMPTY_FORM: EmployeeForm = {
  id: 0,
  code: '',
  fullName: '',
  documentNumber: '',
  position: '',
  department: '',
  phone: '',
  email: '',
  hireDate: '',
  salary: null,
};

@Component({
  selector: 'app-hr',
  imports: [FormsModule, StatusChipComponent, CommonModule, ExportButtonComponent],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>RR.HH.</h1>
          <p class="muted small">Gestión de empleados</p>
        </div>
        <button class="btn btn-primary" (click)="openNew()">+ Nuevo empleado</button>
        <app-export-button resource="employees" [params]="{ q: q }" />
      </div>

      <div class="card">
        <div class="toolbar">
          <input
            class="input search"
            placeholder="Buscar por código, nombre, cargo o departamento…"
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
                <th>Cargo</th>
                <th>Departamento</th>
                <th>Teléfono</th>
                <th>Salario</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (e of items(); track e.id) {
                <tr>
                  <td class="mono">{{ e.code }}</td>
                  <td>
                    <strong>{{ e.fullName }}</strong>
                  </td>
                  <td>{{ e.position || '—' }}</td>
                  <td>{{ e.department || '—' }}</td>
                  <td>{{ e.phone || '—' }}</td>
                  <td>{{ e.salary != null ? 'Bs ' + (e.salary | number: '1.2-2') : '—' }}</td>
                  <td><app-status-chip [value]="e.isActive ? 'TRUE' : 'FALSE'" /></td>
                  <td>
                    <button class="btn btn-ghost btn-sm" (click)="openEdit(e)">Editar</button>
                    @if (e.isActive) {
                      <button class="btn btn-ghost btn-sm text-danger" (click)="deactivate(e)">
                        Desactivar
                      </button>
                    } @else {
                      <button class="btn btn-ghost btn-sm" (click)="activate(e)">Activar</button>
                    }
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8">
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
          <span>{{ meta().totalItems }} empleados</span>
          <div class="pages">
            <button (click)="load(meta().page - 1)" [disabled]="meta().page <= 1">‹</button>
            <span class="muted">Página {{ meta().page }} de {{ meta().totalPages || 1 }}</span>
            <button (click)="load(meta().page + 1)" [disabled]="meta().page >= meta().totalPages">
              ›
            </button>
          </div>
        </div>
      </div>

      @if (showModal()) {
        <div class="backdrop" (click)="closeModal()">
          <div class="modal" (click)="$event.stopPropagation()" [class.submitted]="submitted()">
            <h3>{{ form().id ? 'Editar empleado' : 'Nuevo empleado' }}</h3>
            <div class="form-grid">
              <div class="field">
                <label>Código *</label>
                <input class="input" [(ngModel)]="form().code" name="code" required />
              </div>
              <div class="field">
                <label>Nombre completo *</label>
                <input class="input" [(ngModel)]="form().fullName" name="fullName" required />
              </div>
              <div class="field">
                <label>N.º de documento</label>
                <input class="input" [(ngModel)]="form().documentNumber" name="documentNumber" />
              </div>
              <div class="field">
                <label>Cargo</label>
                <input class="input" [(ngModel)]="form().position" name="position" />
              </div>
              <div class="field">
                <label>Departamento</label>
                <input class="input" [(ngModel)]="form().department" name="department" />
              </div>
              <div class="field">
                <label>Teléfono</label>
                <input class="input" [(ngModel)]="form().phone" name="phone" />
              </div>
              <div class="field">
                <label>Email</label>
                <input class="input" type="email" [(ngModel)]="form().email" name="email" />
              </div>
              <div class="field">
                <label>Fecha de ingreso</label>
                <input class="input" type="date" [(ngModel)]="form().hireDate" name="hireDate" />
              </div>
              <div class="field">
                <label>Salario (Bs)</label>
                <input
                  class="input"
                  type="number"
                  step="0.01"
                  min="0"
                  [(ngModel)]="form().salary"
                  name="salary"
                />
              </div>
            </div>
            <div class="actions">
              <button class="btn" (click)="closeModal()">Cancelar</button>
              <button class="btn btn-primary" [disabled]="saving()" (click)="save()">
                {{ saving() ? 'Guardando…' : 'Guardar' }}
              </button>
            </div>
          </div>
        </div>
      }
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
    .text-danger {
      color: var(--danger);
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 8px;
    }
    .backdrop {
      position: fixed;
      inset: 0;
      background: rgba(10, 15, 25, 0.45);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .modal {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow-md);
      padding: 20px;
      width: min(620px, calc(100vw - 32px));
      max-height: 90vh;
      overflow-y: auto;
    }
  `,
})
export class HrComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  items = signal<Employee[]>([]);
  meta = signal({ page: 1, pageSize: 20, totalItems: 0, totalPages: 0 });
  q = '';

  showModal = signal(false);
  form = signal<EmployeeForm>({ ...EMPTY_FORM });
  saving = signal(false);
  submitted = signal(false);

  constructor() {
    this.load(1);
  }

  load(page: number): void {
    this.api
      .get<Paginated<Employee>>('/employees', { page, pageSize: 20, q: this.q || undefined })
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
    this.form.set({ ...EMPTY_FORM });
    this.submitted.set(false);
    this.showModal.set(true);
  }

  openEdit(e: Employee): void {
    this.form.set({
      id: e.id,
      code: e.code,
      fullName: e.fullName,
      documentNumber: e.documentNumber ?? '',
      position: e.position ?? '',
      department: e.department ?? '',
      phone: e.phone ?? '',
      email: e.email ?? '',
      hireDate: e.hireDate ?? '',
      salary: e.salary != null ? Number(e.salary) : null,
    });
    this.submitted.set(false);
    this.showModal.set(true);
  }

  closeModal(): void {
    if (this.saving()) return;
    this.showModal.set(false);
  }

  async save(): Promise<void> {
    const f = this.form();
    if (!f.code.trim() || !f.fullName.trim()) {
      this.submitted.set(true);
      this.toast.error('Complete los campos obligatorios (marcados en rojo)');
      return;
    }
    this.saving.set(true);
    const payload = {
      code: f.code.trim(),
      fullName: f.fullName.trim(),
      documentNumber: f.documentNumber.trim() || undefined,
      position: f.position.trim() || undefined,
      department: f.department.trim() || undefined,
      phone: f.phone.trim() || undefined,
      email: f.email.trim() || undefined,
      hireDate: f.hireDate || undefined,
      salary: f.salary ?? undefined,
    };
    try {
      if (f.id) {
        await this.api.patch(`/employees/${f.id}`, payload).toPromise();
        this.toast.success('Empleado actualizado');
      } else {
        await this.api.post('/employees', payload).toPromise();
        this.toast.success('Empleado creado');
      }
      this.showModal.set(false);
      this.load(1);
    } catch {
      /* toast del interceptor */
    } finally {
      this.saving.set(false);
    }
  }

  async deactivate(e: Employee): Promise<void> {
    if (!confirm(`¿Desactivar al empleado ${e.fullName}?`)) return;
    try {
      await this.api.patch(`/employees/${e.id}`, { isActive: false }).toPromise();
      this.toast.success('Empleado desactivado');
      this.load(this.meta().page);
    } catch {
      /* toast del interceptor */
    }
  }

  async activate(e: Employee): Promise<void> {
    try {
      await this.api.patch(`/employees/${e.id}`, { isActive: true }).toPromise();
      this.toast.success('Empleado activado');
      this.load(this.meta().page);
    } catch {
      /* toast del interceptor */
    }
  }
}
