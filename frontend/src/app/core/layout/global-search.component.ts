import { Component, computed, effect, signal } from '@angular/core';
import { Router } from '@angular/router';
import { debounceTime, Subject, switchMap } from 'rxjs';
import { ApiService } from '../services/api.service';
import { ShortcutsService } from '../services/shortcuts.service';

export interface SearchHit {
  id: number;
  name?: string;
  fullName?: string;
  sku?: string;
  code?: string;
  docNumber?: string;
  [key: string]: unknown;
}

export interface SearchResults {
  products: SearchHit[];
  customers: SearchHit[];
  suppliers: SearchHit[];
  employees: SearchHit[];
  sales: SearchHit[];
}

type GroupKey = keyof SearchResults;

const GROUP_META: Record<GroupKey, { label: string; icon: string }> = {
  products: { label: 'Repuestos', icon: '🔩' },
  customers: { label: 'Clientes', icon: '👤' },
  suppliers: { label: 'Proveedores', icon: '🏭' },
  employees: { label: 'Empleados', icon: '🧑‍💼' },
  sales: { label: 'Ventas', icon: '🧾' },
};

interface FlatHit {
  key: string;
  group: GroupKey;
  label: string;
  sub: string;
  path: string;
}

@Component({
  selector: 'app-global-search',
  imports: [],
  template: `
    @if (open()) {
      <div class="overlay" (click)="close()">
        <div class="panel" role="dialog" aria-modal="true" aria-label="Búsqueda global" (click)="$event.stopPropagation()">
          <div class="search-row">
            <span class="lens" aria-hidden="true">🔍</span>
            <input
              id="global-search-input"
              class="q"
              type="text"
              placeholder="Buscar repuestos, clientes, proveedores, empleados, ventas…  (Esc para cerrar)"
              [value]="q()"
              (input)="onInput($event)"
              (keydown)="onKeydown($event)"
              autocomplete="off"
            />
            <kbd>⌘K</kbd>
          </div>

          <div class="body">
            @if (loading()) {
              <div class="hint">Buscando…</div>
            } @else if (q().trim() === '') {
              <div class="hint">Escribe para buscar en todo el sistema</div>
            } @else if (flat().length === 0) {
              <div class="hint">Sin resultados para «{{ q() }}»</div>
            } @else {
              <div class="results">
                @for (hit of flat(); track hit.key; let i = $index) {
                  <button
                    class="hit"
                    [class.selected]="i === selected()"
                    (click)="go(hit)"
                    (mouseenter)="selected.set(i)"
                  >
                    <span class="hit-icon" aria-hidden="true">{{ groupMeta[hit.group].icon }}</span>
                    <span class="hit-main">
                      <span class="hit-label">{{ hit.label }}</span>
                      <span class="hit-sub">{{ hit.sub }}</span>
                    </span>
                    <span class="hit-group">{{ groupMeta[hit.group].label }}</span>
                  </button>
                }
              </div>
            }
          </div>

          <div class="footer">
            <span><kbd>↑</kbd><kbd>↓</kbd> navegar</span>
            <span><kbd>↵</kbd> abrir</span>
            <span><kbd>Esc</kbd> cerrar</span>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(9, 14, 24, 0.55);
      backdrop-filter: blur(3px);
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 9vh 16px 16px;
      z-index: 1000;
      animation: fade 0.14s ease;
    }
    @keyframes fade {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .panel {
      width: 100%;
      max-width: 620px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow-md), 0 18px 50px rgba(0, 0, 0, 0.22);
      overflow: hidden;
      animation: pop 0.14s cubic-bezier(0.2, 0.9, 0.3, 1.2);
    }
    @keyframes pop {
      from { transform: translateY(-8px) scale(0.98); opacity: 0; }
      to { transform: translateY(0) scale(1); opacity: 1; }
    }
    .search-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      border-bottom: 1px solid var(--border);
    }
    .lens { opacity: 0.6; }
    .q {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      font-size: 15px;
      color: var(--text);
      font-family: inherit;
    }
    .q::placeholder { color: var(--text-disabled); }
    kbd {
      font-family: inherit;
      font-size: 11px;
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-bottom-width: 2px;
      border-radius: 4px;
      padding: 1px 6px;
      color: var(--text-secondary);
    }
    .body { max-height: 52vh; overflow-y: auto; }
    .hint { padding: 26px; text-align: center; color: var(--text-secondary); font-size: 13px; }
    .results { padding: 6px; }
    .hit {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      text-align: left;
      padding: 9px 12px;
      border: none;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--text);
      font-size: 13.5px;
      font-family: inherit;
      cursor: pointer;
    }
    .hit:hover, .hit.selected { background: var(--surface-hover); }
    .hit-icon { font-size: 16px; width: 20px; text-align: center; }
    .hit-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .hit-label { font-weight: 550; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .hit-sub { font-size: 12px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .hit-group { font-size: 11px; color: var(--text-disabled); text-transform: uppercase; letter-spacing: 0.03em; }
    .footer {
      display: flex;
      gap: 14px;
      padding: 8px 14px;
      border-top: 1px solid var(--border);
      font-size: 11.5px;
      color: var(--text-disabled);
    }
    @media (max-width: 640px) {
      .overlay { padding: 12vh 8px 8px; }
      .hit-group, .footer { display: none; }
    }
  `,
})
export class GlobalSearchComponent {
  readonly open = computed(() => this.shortcuts.searchOpen());
  readonly groupMeta = GROUP_META;
  readonly q = signal('');
  readonly loading = signal(false);
  readonly results = signal<SearchResults>({
    products: [],
    customers: [],
    suppliers: [],
    employees: [],
    sales: [],
  });
  readonly selected = signal(0);

  private readonly query$ = new Subject<string>();

  readonly flat = computed<FlatHit[]>(() => {
    const r = this.results();
    const list: FlatHit[] = [];
    let id = 0;
    for (const group of Object.keys(GROUP_META) as GroupKey[]) {
      for (const hit of r[group]) {
        list.push({
          key: `${group}-${hit.id}-${id++}`,
          group,
          label: String(hit.name ?? hit.fullName ?? hit.docNumber ?? hit.sku ?? ''),
          sub: this.subOf(group, hit),
          path: this.pathOf(group, hit.id),
        });
      }
    }
    return list;
  });

  constructor(
    private shortcuts: ShortcutsService,
    private api: ApiService,
    private router: Router,
  ) {
    this.query$
      .pipe(
        debounceTime(220),
        switchMap((term) => {
          this.loading.set(true);
          return this.api.get<SearchResults>('/search', { q: term, limit: 8 });
        }),
      )
      .subscribe({
        next: (res) => {
          this.results.set(res);
          this.loading.set(false);
          this.selected.set(0);
        },
        error: () => {
          this.loading.set(false);
          this.results.set({ products: [], customers: [], suppliers: [], employees: [], sales: [] });
        },
      });

    effect(() => {
      if (this.open()) {
        this.q.set('');
        this.results.set({ products: [], customers: [], suppliers: [], employees: [], sales: [] });
        this.selected.set(0);
        setTimeout(() => {
          const el = document.getElementById('global-search-input');
          el?.focus();
        });
      }
    });
  }

  onInput(e: Event): void {
    const v = (e.target as HTMLInputElement).value;
    this.q.set(v);
    if (v.trim()) this.query$.next(v);
  }

  onKeydown(e: KeyboardEvent): void {
    const list = this.flat();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.selected.set(Math.min(this.selected() + 1, list.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.selected.set(Math.max(this.selected() - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const hit = list[this.selected()];
      if (hit) this.go(hit);
    }
  }

  go(hit: FlatHit): void {
    this.close();
    this.router.navigate([hit.path]);
  }

  close(): void {
    this.shortcuts.closeSearch();
  }

  private subOf(group: GroupKey, hit: SearchHit): string {
    switch (group) {
      case 'products':
        return `SKU ${hit['sku'] ?? '—'} · Stock ${hit['stock'] ?? 0} · ${(hit as { category?: string }).category ?? ''}`;
      case 'customers':
        return `Código ${hit.code ?? '—'} · ${(hit as { documentNumber?: string }).documentNumber ?? ''}`;
      case 'suppliers':
        return `Código ${hit.code ?? '—'} · ${(hit as { taxId?: string }).taxId ?? ''}`;
      case 'employees':
        return `${(hit as { position?: string }).position ?? '—'} · ${(hit as { department?: string }).department ?? ''}`;
      case 'sales':
        return `Total $${hit['total'] ?? '0'} · ${(hit as { status?: string }).status ?? ''}`;
    }
  }

  private pathOf(group: GroupKey, id: number): string {
    switch (group) {
      case 'products':
        return `/catalog/${id}`;
      case 'customers':
        return '/customers';
      case 'suppliers':
        return '/suppliers';
      case 'employees':
        return '/hr';
      case 'sales':
        return '/sales';
    }
  }
}
