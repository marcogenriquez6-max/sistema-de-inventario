import { Injectable, computed, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { MODULE_BY_PATH } from '../navigation';

export interface UiTab {
  path: string;
  label: string;
  icon: string;
}

const MAX_TABS = 8;
const STORAGE_KEY = 'erp_tabs';

@Injectable({ providedIn: 'root' })
export class TabsService {
  private tabs = signal<UiTab[]>([]);
  readonly list = this.tabs.asReadonly();

  constructor(private auth: AuthService) {
    this.restore();
  }

  private key(): string {
    const id = this.auth.user()?.id ?? 'anon';
    return `${STORAGE_KEY}:${id}`;
  }

  private restore(): void {
    try {
      const raw = localStorage.getItem(this.key());
      if (raw) {
        const parsed = JSON.parse(raw) as UiTab[];
        if (Array.isArray(parsed)) this.tabs.set(parsed.slice(0, MAX_TABS));
      }
    } catch {
      this.tabs.set([]);
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(this.key(), JSON.stringify(this.tabs()));
    } catch {
      /* almacenamiento no disponible */
    }
  }

  /** Registrar la visita a un módulo (navegación). */
  open(path: string): void {
    if (!path.startsWith('/') || path.includes('/new') || /\/\d+$/.test(path)) return;
    const current = this.tabs();
    if (current.some((t) => t.path === path)) return;
    const meta = MODULE_BY_PATH.get(path);
    const tab: UiTab = { path, label: meta?.label ?? path, icon: meta?.icon ?? '📄' };
    const next = [...current, tab].slice(-MAX_TABS);
    this.tabs.set(next);
    this.persist();
  }

  close(path: string): void {
    this.tabs.set(this.tabs().filter((t) => t.path !== path));
    this.persist();
  }

  closeOthers(path: string): void {
    this.tabs.set(this.tabs().filter((t) => t.path === path));
    this.persist();
  }

  /** Módulo "inicio" de tabs (el primer tab, usado como home dentro de la zona de tabs). */
  readonly homePath = computed(() => this.tabs()[0]?.path ?? '/dashboard');
}
