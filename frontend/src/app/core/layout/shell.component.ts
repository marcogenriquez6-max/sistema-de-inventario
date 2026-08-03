import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Role } from '../models';
import { ToastService } from '../services/toast.service';
import { ShortcutsService } from '../services/shortcuts.service';
import { UserPrefsService } from '../services/user-prefs.service';
import { TabsService } from '../services/tabs.service';
import { navForRole } from '../navigation';
import { BreadcrumbsComponent } from './breadcrumbs.component';
import { DynamicTabsComponent } from './dynamic-tabs.component';
import { GlobalSearchComponent } from './global-search.component';
import { NotificationsBellComponent } from './notifications-bell.component';

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    BreadcrumbsComponent,
    DynamicTabsComponent,
    GlobalSearchComponent,
    NotificationsBellComponent,
  ],
  template: `
    <div class="shell" [class.sidebar-collapsed]="collapsed()" [class.mobile-open]="mobileOpen()">
      <div class="scrim" (click)="mobileOpen.set(false)"></div>

      <aside class="sidebar" aria-label="Menú principal">
        <div class="brand" (click)="go('/dashboard')">
          <span class="logo" aria-hidden="true">🔧</span>
          <span class="brand-name">Repuestos ERP</span>
        </div>
        <nav class="nav">
          @for (item of visibleNav(); track item.path) {
            <a
              class="nav-item"
              [routerLink]="item.path"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: item.path === '/dashboard' }"
              (click)="mobileOpen.set(false)"
            >
              <span class="nav-icon" aria-hidden="true">{{ item.icon }}</span>
              <span class="nav-label">{{ item.label }}</span>
            </a>
          }
        </nav>
        <div class="sidebar-footer muted small">
          {{ user()?.fullName ?? '—' }}
          <span class="chip chip-neutral" style="margin-top:4px">{{ role() }}</span>
        </div>
      </aside>

      <div class="main">
        <header class="topbar">
          <button class="btn btn-ghost collapse-btn" (click)="toggleSidebar()" aria-label="Alternar menú">
            <span class="hamburger" aria-hidden="true">☰</span>
          </button>
          <app-breadcrumbs />
          <div class="spacer"></div>

          <button class="search-trigger" (click)="shortcuts.openSearch()">
            <span aria-hidden="true">🔍</span>
            <span class="st-label">Buscar</span>
            <kbd>Ctrl K</kbd>
          </button>

          <app-notifications-bell />

          <button
            class="btn btn-ghost icon-btn"
            (click)="toggleTheme()"
            [attr.aria-label]="dark() ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'"
          >
            {{ dark() ? '☀️' : '🌙' }}
          </button>

          <div class="user-menu">
            <button class="avatar" (click)="menuOpen.set(!menuOpen())" aria-label="Menú de usuario" aria-haspopup="menu">
              {{ initials() }}
            </button>
            @if (menuOpen()) {
              <div class="menu" role="menu">
                <div class="menu-head">
                  <div class="menu-name">{{ user()?.fullName ?? '—' }}</div>
                  <div class="menu-mail muted small">{{ user()?.email ?? '' }}</div>
                  <span class="chip chip-neutral">{{ role() }}</span>
                </div>
                <button class="menu-item" role="menuitem" (click)="go('/settings')">
                  ⚙️ Configuración
                </button>
                <button class="menu-item danger" role="menuitem" (click)="signOut()">
                  🚪 Cerrar sesión
                </button>
              </div>
            }
          </div>
        </header>

        <app-dynamic-tabs />

        <main class="content">
          <router-outlet />
        </main>
      </div>
    </div>

    <app-global-search />
  `,
  styles: `
    .shell {
      display: flex;
      min-height: 100vh;
    }
    .scrim {
      display: none;
    }
    .sidebar {
      width: var(--sidebar-width);
      background: var(--surface);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      position: sticky;
      top: 0;
      height: 100vh;
      transition: width 0.18s ease, transform 0.2s ease;
      z-index: 20;
    }
    .shell.sidebar-collapsed .sidebar {
      width: 64px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px;
      font-weight: 700;
      font-size: 16px;
      cursor: pointer;
      user-select: none;
    }
    .brand .logo {
      font-size: 22px;
    }
    .nav {
      flex: 1;
      overflow-y: auto;
      padding: 6px 10px;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 12px;
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      font-weight: 550;
      font-size: 13.5px;
      text-decoration: none;
      transition: background 0.14s, color 0.14s;
    }
    .nav-item:hover {
      background: var(--surface-hover);
      color: var(--text);
    }
    .nav-item.active {
      background: rgba(30, 111, 217, 0.12);
      color: var(--primary);
    }
    .nav-icon {
      width: 20px;
      text-align: center;
    }
    .sidebar-collapsed .nav-label,
    .sidebar-collapsed .brand-name,
    .sidebar-collapsed .sidebar-footer {
      display: none;
    }
    .sidebar-footer {
      padding: 14px 16px;
      border-top: 1px solid var(--border);
      display: flex;
      flex-direction: column;
    }
    .main {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }
    .topbar {
      height: var(--topbar-height);
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 16px;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 10;
      backdrop-filter: blur(10px);
      background: color-mix(in srgb, var(--surface) 88%, transparent);
    }
    .collapse-btn {
      min-width: 36px;
    }
    .hamburger {
      font-size: 15px;
      line-height: 1;
    }
    .search-trigger {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border: 1px solid var(--border);
      background: var(--surface-2);
      border-radius: var(--radius-sm);
      padding: 6px 10px;
      font-size: 13px;
      color: var(--text-secondary);
      cursor: pointer;
      font-family: inherit;
      transition: border-color 0.14s, background 0.14s;
    }
    .search-trigger:hover {
      border-color: var(--primary);
      background: var(--surface);
      color: var(--text);
    }
    .search-trigger kbd {
      font-family: inherit;
      font-size: 11px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 1px 5px;
      color: var(--text-disabled);
    }
    .icon-btn {
      min-width: 36px;
      justify-content: center;
    }
    .user-menu {
      position: relative;
    }
    .avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      border: 1px solid var(--border);
      background: var(--primary);
      color: var(--primary-contrast);
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.12s;
    }
    .avatar:hover {
      transform: scale(1.05);
    }
    .menu {
      position: absolute;
      right: 0;
      top: calc(100% + 8px);
      width: 240px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow-md);
      padding: 6px;
      z-index: 30;
      animation: pop 0.12s ease;
    }
    @keyframes pop {
      from { opacity: 0; transform: translateY(-6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .menu-head {
      display: flex;
      flex-direction: column;
      gap: 3px;
      padding: 10px 12px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 6px;
    }
    .menu-name {
      font-weight: 650;
    }
    .menu-mail {
      font-size: 12px;
    }
    .menu-head .chip {
      align-self: flex-start;
      margin-top: 6px;
    }
    .menu-item {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      border: none;
      background: transparent;
      color: var(--text);
      padding: 9px 12px;
      border-radius: var(--radius-sm);
      font-size: 13.5px;
      cursor: pointer;
      font-family: inherit;
      text-align: left;
    }
    .menu-item:hover {
      background: var(--surface-hover);
    }
    .menu-item.danger {
      color: var(--danger);
    }
    .content {
      padding: 0;
      flex: 1;
    }

    @media (max-width: 900px) {
      .sidebar {
        position: fixed;
        left: 0;
        top: 0;
        transform: translateX(-100%);
        width: var(--sidebar-width) !important;
        box-shadow: var(--shadow-md);
      }
      .shell.mobile-open .sidebar {
        transform: translateX(0);
      }
      .scrim {
        display: block;
        position: fixed;
        inset: 0;
        background: rgba(9, 14, 24, 0.5);
        z-index: 15;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s;
      }
      .shell.mobile-open .scrim {
        opacity: 1;
        pointer-events: auto;
      }
      .search-trigger .st-label {
        display: none;
      }
    }
    @media (max-width: 560px) {
      .topbar {
        gap: 8px;
        padding: 0 10px;
      }
      app-breadcrumbs {
        display: none;
      }
    }
  `,
})
export class ShellComponent {
  readonly user = computed(() => this.auth.user());
  readonly role = computed(() => this.auth.role());
  private readonly prefs = inject(UserPrefsService);
  readonly collapsed = signal(this.prefs.current().sidebarCollapsed);
  readonly dark = signal(this.prefs.current().theme === 'dark');
  readonly mobileOpen = signal(false);
  readonly menuOpen = signal(false);

  readonly visibleNav = computed(() => navForRole(this.role()));

  readonly initials = computed(() => {
    const name = this.user()?.fullName ?? '?';
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase();
  });

  constructor(
    private auth: AuthService,
    private router: Router,
    private toast: ToastService,
    readonly shortcuts: ShortcutsService,
    private tabs: TabsService,
  ) {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.tabs.open(e.urlAfterRedirects.split('?')[0]));

    this.shortcuts.toggleTheme.subscribe(() => this.toggleTheme());
    this.shortcuts.toggleSidebar.subscribe(() => this.toggleSidebar());
    document.addEventListener('click', () => this.menuOpen.set(false));
  }

  go(path: string): void {
    this.menuOpen.set(false);
    this.router.navigate([path]);
  }

  toggleSidebar(): void {
    const next = !this.collapsed();
    this.collapsed.set(next);
    this.prefs.save({ sidebarCollapsed: next });
  }

  toggleTheme(): void {
    this.prefs.toggleTheme();
    this.dark.set(this.prefs.current().theme === 'dark');
  }

  async signOut(): Promise<void> {
    this.menuOpen.set(false);
    await this.auth.logout();
    this.toast.info('Sesión cerrada');
    this.router.navigate(['/login']);
  }
}
