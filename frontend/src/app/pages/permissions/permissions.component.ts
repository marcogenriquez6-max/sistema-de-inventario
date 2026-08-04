import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PermissionsService, PermissionMatrix } from '../../core/services/permissions.service';
import { ToastService } from '../../core/services/toast.service';

const MODULE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  pos: 'Punto de Venta',
  catalog: 'Catálogo',
  inventory: 'Inventario',
  sales: 'Ventas',
  customers: 'Clientes',
  suppliers: 'Proveedores',
  purchases: 'Compras',
  cash_register: 'Caja',
  accounting: 'Contabilidad',
  banking: 'Bancos',
  hr: 'RR.HH.',
  documents: 'Documentos',
  tasks: 'Tareas (Tablero / Calendario)',
  audit: 'Auditoría',
  reports: 'Reportes',
  users: 'Usuarios',
  settings: 'Configuración',
  permissions: 'Roles y Permisos',
  export: 'Exportación',
  notifications: 'Notificaciones',
  chat: 'Chat',
  search: 'Búsqueda global',
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  MANAGER: 'Gerente',
  SELLER: 'Vendedor',
  INVENTORY_MANAGER: 'Encargado inventario',
  AUDITOR: 'Auditor',
};

@Component({
  selector: 'app-permissions',
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Roles y Permisos</h1>
          <p class="muted small">
            Define qué módulos puede usar cada rol. Los cambios se aplican de inmediato
            a menú, rutas y a las API del backend.
          </p>
        </div>
        <div class="actions">
          <button class="btn btn-ghost" [disabled]="loading() || saving()" (click)="reset()">
            Restaurar por defecto
          </button>
          <button class="btn btn-primary" [disabled]="loading() || saving() || !dirty()" (click)="save()">
            {{ saving() ? 'Guardando…' : 'Guardar cambios' }}
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="card card-pad empty">
          <div class="icon">🔐</div>
          Cargando matriz de permisos…
        </div>
      } @else {
        <div class="card">
          <div class="table-wrap">
            <table class="data matrix">
              <thead>
                <tr>
                  <th>Módulo</th>
                  @for (r of roles(); track r) {
                    <th class="col">
                      <span class="role-name">{{ ROLE_LABELS[r] ?? r }}</span>
                      @if (r === 'ADMIN') {
                        <span class="hint">siempre</span>
                      }
                    </th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (m of modules(); track m) {
                  <tr>
                    <td>
                      <span class="mod-name">{{ MODULE_LABELS[m] ?? m }}</span>
                      <span class="mod-slug">{{ m }}</span>
                    </td>
                    @for (r of roles(); track r) {
                      <td class="col">
                        @if (r === 'ADMIN') {
                          <span class="check on">✔</span>
                        } @else {
                          <label class="switch">
                            <input
                              type="checkbox"
                              [checked]="matrix()[r][m]"
                              (change)="toggle(r, m)"
                            />
                            <span class="track"></span>
                          </label>
                        }
                      </td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <p class="muted small note">
          Nota: los permisos se suman a la validación por operación que ya existe en el
          backend (p. ej. anular ventas sigue siendo solo para administradores).
        </p>
      }
    </div>
  `,
  styles: `
    .actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .matrix th.col,
    .matrix td.col {
      text-align: center;
      min-width: 120px;
    }
    .role-name {
      font-size: 12px;
      font-weight: 700;
      text-transform: none;
      letter-spacing: 0;
      color: var(--text);
    }
    .hint {
      display: block;
      font-size: 10px;
      font-weight: 500;
      color: var(--text-disabled);
      text-transform: none;
      letter-spacing: 0;
    }
    .mod-name {
      font-weight: 600;
    }
    .mod-slug {
      display: block;
      font-size: 11px;
      color: var(--text-disabled);
      font-family: 'Cascadia Code', Consolas, monospace;
    }
    .check {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      border-radius: 8px;
      background: var(--primary-soft);
      color: var(--primary);
      font-size: 13px;
      font-weight: 700;
    }
    .switch {
      position: relative;
      display: inline-block;
      cursor: pointer;
    }
    .switch input {
      position: absolute;
      opacity: 0;
      width: 100%;
      height: 100%;
      margin: 0;
      cursor: pointer;
    }
    .track {
      display: inline-block;
      width: 40px;
      height: 22px;
      border-radius: 999px;
      background: var(--surface-2);
      border: 1px solid var(--border-strong);
      position: relative;
      transition: background 0.16s, border-color 0.16s;
      vertical-align: middle;
    }
    .track::after {
      content: '';
      position: absolute;
      top: 2px;
      left: 2px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: var(--surface);
      border: 1px solid var(--border-strong);
      transition: transform 0.16s, background 0.16s;
    }
    .switch input:checked + .track {
      background: var(--primary);
      border-color: var(--primary);
    }
    .switch input:checked + .track::after {
      transform: translateX(18px);
      background: #fff;
      border-color: transparent;
    }
    .switch input:focus-visible + .track {
      box-shadow: 0 0 0 3px var(--primary-soft);
    }
    .note {
      margin-top: 12px;
    }
  `,
})
export class PermissionsComponent {
  private perms = inject(PermissionsService);
  private toast = inject(ToastService);

  protected readonly ROLE_LABELS = ROLE_LABELS;
  protected readonly MODULE_LABELS = MODULE_LABELS;

  roles = signal<string[]>([]);
  modules = signal<string[]>([]);
  matrix = signal<PermissionMatrix>({});
  loading = signal(true);
  saving = signal(false);
  dirty = signal(false);

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await this.perms.getFull();
      if (res) {
        this.roles.set(res.roles);
        this.modules.set(res.modules);
        this.matrix.set(res.matrix);
      }
    } catch {
      this.toast.error('No se pudo cargar la matriz de permisos');
    } finally {
      this.loading.set(false);
      this.dirty.set(false);
    }
  }

  toggle(role: string, module: string): void {
    if (role === 'ADMIN') return;
    const next = structuredClone(this.matrix());
    if (!next[role]) next[role] = {};
    next[role][module] = !next[role][module];
    this.matrix.set(next);
    this.dirty.set(true);
  }

  async save(): Promise<void> {
    this.saving.set(true);
    try {
      await this.perms.save(this.matrix());
      this.perms.refresh();
      this.toast.success('Permisos actualizados');
      this.dirty.set(false);
    } catch {
      this.toast.error('Error al guardar los permisos');
    } finally {
      this.saving.set(false);
    }
  }

  async reset(): Promise<void> {
    this.saving.set(true);
    try {
      await this.perms.reset();
      this.perms.refresh();
      this.toast.success('Permisos restaurados');
      await this.load();
    } catch {
      this.toast.error('Error al restaurar los permisos');
    } finally {
      this.saving.set(false);
    }
  }
}
