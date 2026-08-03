import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { UserPrefsService } from '../../core/services/user-prefs.service';
import { Setting } from '../../core/models';

interface SettingHistoryItem {
  value: Record<string, unknown>;
  createdAt: string;
  changedBy?: string;
}

@Component({
  selector: 'app-settings',
  imports: [FormsModule, CommonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Configuración</h1>
          <p class="muted small">Parámetros del sistema (solo administración)</p>
        </div>
      </div>

      <div class="card card-pad prefs">
        <h3>Preferencias de usuario</h3>
        <p class="muted small" style="margin-bottom: 12px">
          Se guardan en este dispositivo y se aplican a tu sesión.
        </p>
        <div class="pref-grid">
          <div class="field">
            <label for="pref-theme">Tema</label>
            <select
              id="pref-theme"
              class="select"
              [value]="prefs.current().theme"
              (change)="onTheme($event)"
            >
              <option value="system">Sistema (automático)</option>
              <option value="light">Claro</option>
              <option value="dark">Oscuro</option>
            </select>
          </div>
          <div class="field">
            <label for="pref-page">Tamaño de página (listas)</label>
            <select
              id="pref-page"
              class="select"
              [value]="prefs.current().pageSize"
              (change)="onPageSize($event)"
            >
              <option [ngValue]="10">10</option>
              <option [ngValue]="20">20</option>
              <option [ngValue]="50">50</option>
              <option [ngValue]="100">100</option>
            </select>
          </div>
        </div>

        <h3 style="margin-top: 18px">Atajos de teclado</h3>
        <div class="kbd-grid">
          <span><kbd>Ctrl</kbd> + <kbd>K</kbd> — búsqueda global</span>
          <span><kbd>/</kbd> — búsqueda global</span>
          <span><kbd>Ctrl</kbd> + <kbd>D</kbd> — alternar tema</span>
          <span><kbd>Ctrl</kbd> + <kbd>B</kbd> — colapsar menú lateral</span>
          <span><kbd>Ctrl</kbd> + <kbd>?</kbd> — esta ayuda</span>
          <span><kbd>Esc</kbd> — cerrar ventanas</span>
        </div>
      </div>

      <div class="card">
        <div class="table-wrap">
          <table class="data">
            <thead>
              <tr>
                <th>Parámetro</th>
                <th>Valor</th>
                <th>Actualizado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (s of settings(); track s.key) {
                <tr>
                  <td class="mono">{{ s.key }}</td>
                  <td>
                    <pre class="json">{{ s.value | json }}</pre>
                  </td>
                  <td class="small muted">{{ (s.updatedAt | date: 'dd/MM/yyyy HH:mm') || '—' }}</td>
                  <td>
                    <button class="btn btn-ghost btn-sm" (click)="openEdit(s)">Editar</button>
                    <button class="btn btn-ghost btn-sm" (click)="openHistory(s.key)">
                      Historial
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4">
                    <div class="empty">
                      <div class="icon">⚙</div>
                      Sin parámetros
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      @if (showEdit()) {
        <div class="backdrop" (click)="closeEdit()">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3>Editar {{ editKey() }}</h3>
            <div class="field">
              <label>Valor (JSON)</label>
              <textarea
                class="input code"
                rows="8"
                [ngModel]="editText()"
                (ngModelChange)="editText.set($event)"
                placeholder='{ "clave": "valor" }'
              ></textarea>
              <span class="small" [style.color]="jsonValid() ? 'var(--success)' : 'var(--danger)'">
                {{ jsonValid() ? 'JSON válido' : 'JSON inválido' }}
              </span>
            </div>
            <div class="actions">
              <button class="btn" (click)="closeEdit()">Cancelar</button>
              <button
                class="btn btn-primary"
                [disabled]="saving() || !jsonValid()"
                (click)="saveEdit()"
              >
                {{ saving() ? 'Guardando…' : 'Guardar' }}
              </button>
            </div>
          </div>
        </div>
      }

      @if (showHistory()) {
        <div class="backdrop" (click)="closeHistory()">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3>Historial de {{ historyKey() }}</h3>
            <div class="table-wrap">
              <table class="data">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  @for (h of history(); track $index) {
                    <tr>
                      <td class="small muted">{{ h.createdAt | date: 'dd/MM/yyyy HH:mm:ss' }}</td>
                      <td>
                        <pre class="json">{{ h.value | json }}</pre>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="2">
                        <div class="empty">
                          <div class="icon">🗂️</div>
                          Sin cambios registrados
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <div class="actions">
              <button class="btn" (click)="closeHistory()">Cerrar</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .json {
      background: var(--surface-2);
      padding: 8px 10px;
      border-radius: var(--radius-sm);
      margin: 0;
      font-family: 'Cascadia Code', Consolas, monospace;
      font-size: 12px;
      overflow-x: auto;
      max-width: 480px;
      white-space: pre-wrap;
    }
    .code {
      font-family: 'Cascadia Code', Consolas, monospace;
    }
    .pref-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 0 16px;
    }
    .kbd-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 6px 16px;
      font-size: 12.5px;
      color: var(--text-secondary);
    }
    .kbd-grid kbd {
      font-family: inherit;
      font-size: 11px;
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-bottom-width: 2px;
      border-radius: 4px;
      padding: 1px 5px;
      color: var(--text-secondary);
    }
    .btn-sm {
      padding: 4px 10px;
      font-size: 12.5px;
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 14px;
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
      width: min(640px, calc(100vw - 32px));
      max-height: 90vh;
      overflow-y: auto;
    }
  `,
})
export class SettingsComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  protected prefs = inject(UserPrefsService);

  settings = signal<Setting[]>([]);

  showEdit = signal(false);
  editKey = signal('');
  editText = signal('');
  saving = signal(false);

  showHistory = signal(false);
  historyKey = signal('');
  history = signal<SettingHistoryItem[]>([]);

  jsonValid = computed(() => this.isValidJson(this.editText()));

  constructor() {
    this.load();
  }

  private isValidJson(t: string): boolean {
    try {
      JSON.parse(t);
      return true;
    } catch {
      return false;
    }
  }

  load(): void {
    this.api.get<Setting[]>('/settings').subscribe((res) => this.settings.set(res));
  }

  openEdit(s: Setting): void {
    this.editKey.set(s.key);
    this.editText.set(JSON.stringify(s.value, null, 2));
    this.showEdit.set(true);
  }

  closeEdit(): void {
    if (this.saving()) return;
    this.showEdit.set(false);
  }

  async saveEdit(): Promise<void> {
    let value: Record<string, unknown>;
    try {
      value = JSON.parse(this.editText());
    } catch {
      return;
    }
    this.saving.set(true);
    try {
      await this.api.patch(`/settings/${this.editKey()}`, { value }).toPromise();
      this.toast.success('Parámetro actualizado');
      this.showEdit.set(false);
      this.load();
    } catch {
      /* toast del interceptor */
    } finally {
      this.saving.set(false);
    }
  }

  openHistory(key: string): void {
    this.historyKey.set(key);
    this.history.set([]);
    this.showHistory.set(true);
    this.api
      .get<SettingHistoryItem[]>(`/settings/history/${key}`)
      .subscribe((res) => this.history.set(res));
  }

  closeHistory(): void {
    this.showHistory.set(false);
  }

  onTheme(e: Event): void {
    const theme = (e.target as HTMLSelectElement).value as 'system' | 'light' | 'dark';
    this.prefs.save({ theme });
    this.toast.success('Tema actualizado');
  }

  onPageSize(e: Event): void {
    const pageSize = Number((e.target as HTMLSelectElement).value) || 20;
    this.prefs.save({ pageSize });
    this.toast.success('Tamaño de página guardado');
  }
}
