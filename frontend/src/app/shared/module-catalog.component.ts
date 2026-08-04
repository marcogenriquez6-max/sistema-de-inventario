import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { ApiService } from '../core/services/api.service';

interface ModuleItem {
  name: string;
  slug: string;
  enabled: boolean;
  description: string;
  category: 'core' | 'operational' | 'financial' | 'support';
}

interface ModuleState {
  enabledCount: number;
  totalCount: number;
  modules: ModuleItem[];
}

const CATEGORIES: { key: string; label: string; hint: string }[] = [
  { key: 'core', label: 'Núcleo del sistema', hint: 'Seguridad y administración' },
  { key: 'operational', label: 'Operaciones', hint: 'Venta y abastecimiento' },
  { key: 'financial', label: 'Financiero', hint: 'Caja, bancos y contabilidad' },
  { key: 'support', label: 'Soporte', hint: 'Reportes, auditoría e integración' },
];

const ICONS: Record<string, string> = {
  auth: '🔐',
  users: '👥',
  settings: '⚙️',
  catalog: '🔩',
  pricing: '💰',
  inventory: '📦',
  sales: '🧾',
  pos: '🛒',
  dashboard: '📊',
  customers: '👤',
  suppliers: '🏭',
  purchases: '📥',
  cash_register: '💵',
  banking: '🏦',
  accounting: '📒',
  hr: '🧑‍💼',
  documents: '🗂️',
  tasks: '🗃️',
  reports: '📈',
  audit: '🔎',
  public_api: '🔌',
  integrations: '🔗',
  permissions: '🔑',
};

@Component({
  selector: 'app-module-catalog',
  imports: [],
  template: `
    <div class="mc" [class.mc-dark]="onDark()" [class.mc-grid]="mode() === 'grid'" [class.mc-chips]="mode() === 'chips'">
      @if (state() === null && !error()) {
        <p class="muted small">Cargando módulos…</p>
      }

      @if (error()) {
        <p class="muted small">No se pudo cargar el catálogo de módulos.</p>
      }

      @if (mode() === 'grid' && state()?.modules?.length) {
        @if (showHeader()) {
          <div class="mc-header">
            <div>
              <h3>{{ title() }}</h3>
              <p class="muted small">{{ subtitle() }}</p>
            </div>
            <span class="pill">{{ state()?.enabledCount ?? 0 }}/{{ state()?.totalCount ?? 0 }} activos</span>
          </div>
        }
        @for (cat of CATEGORIES; track cat.key) {
          <div class="mc-cat">
            <div class="mc-cat-head">
              <div>
                <strong>{{ cat.label }}</strong>
                <span class="mc-cat-hint">{{ cat.hint }}</span>
              </div>
              <span class="mc-count">{{ count(cat.key) }}</span>
            </div>
            <div class="module-grid">
              @for (m of modulesFor(cat.key); track m.slug) {
                <div class="module-card">
                  <div class="module-top">
                    <span class="mod-icon">{{ icon(m.slug) }}</span>
                    <strong>{{ m.name }}</strong>
                  </div>
                  <p class="muted small">{{ m.description }}</p>
                  <span
                    class="chip"
                    [class.chip-success]="m.enabled"
                    [class.chip-neutral]="!m.enabled"
                  >{{ m.enabled ? 'Activo' : 'Desactivado' }}</span>
                </div>
              }
            </div>
          </div>
        }
      }

      @if (mode() === 'chips' && state()?.modules?.length) {
        <div class="mc-chip-wrap">
          @for (m of state()?.modules ?? []; track m.slug) {
            <span class="mod-chip">{{ icon(m.slug) }} {{ m.name }}</span>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .mc-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 18px;
    }
    .mc-header h3 {
      margin: 0 0 3px;
    }
    .mc-cat {
      margin-bottom: 20px;
    }
    .mc-cat:last-child {
      margin-bottom: 0;
    }
    .mc-cat-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-bottom: 10px;
    }
    .mc-cat-hint {
      display: block;
      font-size: 12px;
      font-weight: 400;
      color: var(--text-disabled);
      margin-top: 1px;
    }
    .mc-count {
      flex: none;
      min-width: 22px;
      height: 22px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      background: var(--primary-soft);
      color: var(--primary);
      font-size: 12px;
      font-weight: 700;
    }
    .module-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
      gap: 12px;
    }
    .module-card {
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 14px;
      background: var(--surface-2);
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s;
    }
    .module-card:hover {
      border-color: var(--primary);
      transform: translateY(-2px);
      box-shadow: var(--shadow-sm);
    }
    .module-top {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .mod-icon {
      width: 34px;
      height: 34px;
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 9px;
      background: var(--primary-soft);
      font-size: 16px;
    }
    .module-top strong {
      font-size: 14px;
      line-height: 1.25;
    }
    .module-card p {
      margin: 0;
      line-height: 1.45;
    }
    .module-card .chip {
      align-self: flex-start;
    }

    .mc-chip-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .mod-chip {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      font-size: 12.5px;
      font-weight: 550;
      color: var(--text);
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 999px;
      padding: 5px 11px;
    }
    .mc-dark .mod-chip {
      color: #fff;
      background: rgba(255, 255, 255, 0.14);
      border: 1px solid rgba(255, 255, 255, 0.22);
    }
    .mc-dark .mc-count {
      background: rgba(255, 255, 255, 0.18);
      color: #fff;
    }

    @media (max-width: 560px) {
      .module-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class ModuleCatalogComponent implements OnInit {
  readonly mode = input<'grid' | 'chips'>('grid');
  readonly showHeader = input(true);
  readonly title = input('Módulos del sistema');
  readonly subtitle = input('Todo lo que necesitas para gestionar tu negocio de repuestos');
  readonly onDark = input(false);

  readonly CATEGORIES = CATEGORIES;

  private api = inject(ApiService);
  readonly state = signal<ModuleState | null>(null);
  readonly error = signal(false);

  readonly byCategory = computed<Record<string, ModuleItem[]>>(() => {
    const out: Record<string, ModuleItem[]> = {};
    for (const m of this.state()?.modules ?? []) {
      (out[m.category] ??= []).push(m);
    }
    return out;
  });

  ngOnInit(): void {
    this.api.get<ModuleState>('/health/modules').subscribe({
      next: (s) => this.state.set(s),
      error: () => this.error.set(true),
    });
  }

  count(key: string): number {
    return this.byCategory()[key]?.length ?? 0;
  }

  modulesFor(key: string): ModuleItem[] {
    return this.byCategory()[key] ?? [];
  }

  icon(slug: string): string {
    return ICONS[slug] ?? '🧩';
  }
}
