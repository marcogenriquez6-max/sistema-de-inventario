import { Injectable, computed, signal } from '@angular/core';
import { AuthService } from './auth.service';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface UserPrefs {
  theme: ThemeMode;
  sidebarCollapsed: boolean;
  pageSize: number;
}

const DEFAULTS: UserPrefs = { theme: 'system', sidebarCollapsed: false, pageSize: 20 };

@Injectable({ providedIn: 'root' })
export class UserPrefsService {
  private prefs = signal<UserPrefs>({ ...DEFAULTS });
  readonly current = this.prefs.asReadonly();
  readonly pageSize = computed(() => this.prefs().pageSize);

  constructor(private auth: AuthService) {
    this.load();
    this.applyTheme(this.prefs().theme);
  }

  private key(): string {
    const id = this.auth.user()?.id ?? 'anon';
    return `erp_prefs:${id}`;
  }

  load(): void {
    try {
      const raw = localStorage.getItem(this.key());
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<UserPrefs>;
        this.prefs.set({ ...DEFAULTS, ...parsed });
      }
    } catch {
      this.prefs.set({ ...DEFAULTS });
    }
  }

  save(next: Partial<UserPrefs>): void {
    const merged = { ...this.prefs(), ...next };
    this.prefs.set(merged);
    try {
      localStorage.setItem(this.key(), JSON.stringify(merged));
    } catch {
      /* almacenamiento no disponible */
    }
    if (next.theme) this.applyTheme(next.theme);
  }

  toggleTheme(): void {
    this.save({
      theme:
        this.prefs().theme === 'dark' ? 'light' : this.prefs().theme === 'light' ? 'system' : 'dark',
    });
  }

  private applyTheme(theme: ThemeMode): void {
    const body = document.body;
    body.classList.remove('theme-dark', 'theme-light');
    if (theme === 'dark') body.classList.add('theme-dark');
    if (theme === 'light') body.classList.add('theme-light');
  }
}
