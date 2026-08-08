import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { User, Role, Paginated } from '../../core/models';
import { StatusChipComponent } from '../../shared/status-chip.component';

interface UserForm {
  id: number;
  email: string;
  fullName: string;
  password: string;
  role: Role;
}

const ROLES: { value: Role; label: string; desc: string }[] = [
  { value: 'ADMIN', label: 'Administrador', desc: 'Acceso total al sistema' },
  { value: 'MANAGER', label: 'Gerente', desc: 'Gestión y reportes' },
  { value: 'SELLER', label: 'Vendedor', desc: 'POS y catálogo' },
  { value: 'INVENTORY_MANAGER', label: 'Inventario', desc: 'Compras y ajustes' },
  { value: 'AUDITOR', label: 'Auditor', desc: 'Solo lectura y auditoría' },
];

function emptyForm(): UserForm {
  return { id: 0, email: '', fullName: '', password: '', role: 'SELLER' };
}

@Component({
  selector: 'app-users',
  imports: [FormsModule, StatusChipComponent, CommonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Usuarios</h1>
          <p class="muted small">Cuentas de acceso y roles del sistema</p>
        </div>
        <button class="btn btn-primary" (click)="openNew()">+ Nuevo usuario</button>
      </div>

      <div class="card">
        <div class="toolbar">
          <input
            class="input search"
            placeholder="Buscar por nombre o correo…"
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
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Creado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (u of items(); track u.id) {
                <tr>
                  <td>
                    <strong>{{ u.fullName }}</strong>
                  </td>
                  <td class="mono">{{ u.email }}</td>
                  <td><span class="role-chip">{{ roleLabel(u.role) }}</span></td>
                  <td><app-status-chip [value]="u.isActive === false ? 'FALSE' : 'TRUE'" /></td>
                  <td class="muted small">{{ (u.createdAt ?? '—') | date: 'short' }}</td>
                  <td>
                    <div class="actions">
                      <button class="btn btn-ghost btn-sm" (click)="openEdit(u)">Editar</button>
                      @if (u.isActive === false) {
                        <button class="btn btn-ghost btn-sm" (click)="toggle(u, true)">Activar</button>
                      } @else {
                        <button class="btn btn-ghost btn-sm" (click)="toggle(u, false)">Desactivar</button>
                      }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6">
                    <div class="empty">
                      <div class="icon">👥</div>
                      Sin usuarios
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="pagination">
          <span>{{ meta().totalItems }} usuarios</span>
          <div class="pages">
            <button (click)="load(meta().page - 1)" [disabled]="meta().page <= 1">‹</button>
            <span class="muted">Página {{ meta().page }} de {{ meta().totalPages || 1 }}</span>
            <button (click)="load(meta().page + 1)" [disabled]="meta().page >= meta().totalPages">›</button>
          </div>
        </div>
      </div>
    </div>

    @if (modalOpen()) {
      <div class="backdrop" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>{{ editing() ? 'Editar usuario' : 'Nuevo usuario' }}</h3>
          <form #f="ngForm" (ngSubmit)="save(f)" novalidate [class.submitted]="submitted()">
            <div class="form-grid">
              <div class="field">
                <label>Nombre completo *</label>
                <input class="input" name="fullName" [(ngModel)]="form().fullName" required maxlength="150" />
              </div>
              <div class="field">
                <label>Correo electrónico *</label>
                <input class="input" type="email" name="email" [(ngModel)]="form().email" required email maxlength="255" [readonly]="editing()" [class.readonly]="editing()" />
              </div>
              @if (!editing()) {
                <div class="field">
                  <label>Contraseña *</label>
                  <input class="input" type="password" name="password" [(ngModel)]="form().password" required minlength="8" maxlength="128" placeholder="Mínimo 8 caracteres" autocomplete="new-password" />
                </div>
              }
              <div class="field">
                <label>Rol *</label>
                <select class="select" name="role" [(ngModel)]="form().role" required>
                  @for (r of ROLES; track r.value) {
                    <option [ngValue]="r.value">{{ r.label }}</option>
                  }
                </select>
                <span class="hint">{{ roleHint(form().role) }}</span>
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
    .role-chip {
      display: inline-flex;
      padding: 3px 10px;
      border-radius: 999px;
      background: var(--surface-2);
      border: 1px solid var(--border);
      color: var(--text-secondary);
      font-size: 12.5px;
      font-weight: 600;
    }
    .hint {
      display: block;
      font-size: 12px;
      color: var(--text-secondary);
      margin-top: 4px;
    }
    .readonly {
      background: var(--surface-2);
      opacity: 0.75;
      cursor: not-allowed;
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
export class UsersComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  readonly ROLES = ROLES;

  items = signal<User[]>([]);
  meta = signal({ page: 1, pageSize: 20, totalItems: 0, totalPages: 0 });
  q = '';

  modalOpen = signal(false);
  editing = signal(false);
  saving = signal(false);
  submitted = signal(false);
  form = signal<UserForm>(emptyForm());

  constructor() {
    this.load(1);
  }

  load(page: number): void {
    this.api
      .get<Paginated<User>>('/users', { page, pageSize: 20, search: this.q || undefined })
      .subscribe((res) => {
        this.items.set(res.items);
        this.meta.set(res.meta);
      });
  }

  reset(): void {
    this.q = '';
    this.load(1);
  }

  roleLabel(role: Role): string {
    return ROLES.find((r) => r.value === role)?.label ?? role;
  }

  roleHint(role: Role): string {
    return ROLES.find((r) => r.value === role)?.desc ?? '';
  }

  openNew(): void {
    this.form.set(emptyForm());
    this.editing.set(false);
    this.submitted.set(false);
    this.modalOpen.set(true);
  }

  openEdit(u: User): void {
    this.form.set({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      password: '',
      role: u.role,
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
    try {
      if (this.editing()) {
        await this.api
          .patch(`/users/${fm.id}`, {
            fullName: fm.fullName,
            role: fm.role,
            ...(fm.password ? { password: fm.password } : {}),
          })
          .toPromise();
        this.toast.success('Usuario actualizado');
      } else {
        await this.api
          .post('/users', {
            fullName: fm.fullName,
            email: fm.email,
            password: fm.password,
            role: fm.role,
          })
          .toPromise();
        this.toast.success('Usuario creado');
      }
      this.closeModal();
      this.load(this.meta().page);
    } catch {
      /* toast del interceptor */
    } finally {
      this.saving.set(false);
    }
  }

  async toggle(u: User, active: boolean): Promise<void> {
    if (!confirm(`¿${active ? 'Activar' : 'Desactivar'} al usuario "${u.fullName}"?`)) return;
    try {
      await this.api.patch(`/users/${u.id}`, { isActive: active }).toPromise();
      this.toast.success(active ? 'Usuario activado' : 'Usuario desactivado');
      this.load(this.meta().page);
    } catch {
      /* toast del interceptor */
    }
  }
}
