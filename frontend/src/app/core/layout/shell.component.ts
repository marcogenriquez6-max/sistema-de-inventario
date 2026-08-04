import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Role } from '../models';
import { ToastService } from '../services/toast.service';
import { ShortcutsService } from '../services/shortcuts.service';
import { UserPrefsService } from '../services/user-prefs.service';
import { TabsService } from '../services/tabs.service';
import { navForModules, groupNav, NavSection } from '../navigation';
import { PermissionsService } from '../services/permissions.service';
import { BreadcrumbsComponent } from './breadcrumbs.component';
import { DynamicTabsComponent } from './dynamic-tabs.component';
import { GlobalSearchComponent } from './global-search.component';
import { NotificationsBellComponent } from './notifications-bell.component';
import { ChatWidgetComponent } from './chat-widget.component';

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
    ChatWidgetComponent,
  ],
  template: `
    <div class="shell" [class.sidebar-collapsed]="collapsed()" [class.mobile-open]="mobileOpen()">
      <a class="skip-link" (click)="skipToContent($event)">Saltar al contenido</a>
      <div class="scrim" (click)="mobileOpen.set(false)"></div>

      <aside class="sidebar" aria-label="Menú principal">
        <div class="brand" (click)="go('/dashboard')">
          <img class="logo" src="logo.jpg" alt="Repuestos ERP" />
          <span class="brand-name">Repuestos ERP</span>
        </div>
        <nav class="nav">
          @for (section of navSections(); track section.label) {
            <div class="nav-section-label">{{ section.label }}</div>
            @for (item of section.items; track item.path) {
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
          }
        </nav>
        <div class="sidebar-footer">
          <span class="side-name">{{ user()?.fullName ?? '—' }}</span>
          <span class="side-role">{{ role() }}</span>
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

        <main class="content" id="main" tabindex="-1">
          <router-outlet />
        </main>
      </div>
    </div>

    <app-global-search />
    <app-chat-widget />
  `,
  styles: `
    .shell {
      display: flex;
      min-height: 100vh;
    }
    .skip-link {
      position: absolute;
      top: -60px;
      left: 12px;
      z-index: 100;
      background: var(--primary);
      color: var(--primary-contrast);
      padding: 10px 16px;
      border-radius: 0 0 var(--radius-sm) var(--radius-sm);
      font-weight: 600;
      font-size: 13px;
      transition: top 0.15s ease;
    }
    .skip-link:focus {
      top: 0;
    }
    .scrim {
      display: none;
    }
    .sidebar {
      width: var(--sidebar-width);
      background: linear-gradient(180deg, var(--sidebar-bg) 0%, var(--sidebar-bg-2) 100%);
      border-right: 1px solid var(--sidebar-border);
      box-shadow: 1px 0 8px rgba(15, 23, 42, 0.04);
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
      gap: 11px;
      padding: 18px 16px;
      font-weight: 750;
      font-size: 16px;
      color: var(--sidebar-text-active);
      cursor: pointer;
      user-select: none;
      border-bottom: 1px solid var(--sidebar-border);
    }
    .brand .logo {
      width: 32px;
      height: 32px;
      object-fit: contain;
      border-radius: 9px;
      background: var(--surface-2);
      border: 1px solid var(--sidebar-border);
      padding: 4px;
      flex: none;
    }
    .brand-name {
      white-space: nowrap;
      letter-spacing: -0.01em;
    }
    .nav {
      flex: 1;
      overflow-y: auto;
      padding: 8px 10px;
    }
    .nav-section-label {
      padding: 14px 12px 6px;
      font-size: 10.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-disabled);
      white-space: nowrap;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 11px;
      padding: 9px 12px;
      border-radius: var(--radius-sm);
      color: var(--sidebar-text);
      font-weight: 550;
      font-size: 13.5px;
      text-decoration: none;
      margin-bottom: 2px;
      position: relative;
      transition: background 0.14s, color 0.14s;
    }
    .nav-item:hover {
      background: var(--surface-hover);
      color: var(--sidebar-text-active);
    }
    .nav-item.active {
      background: var(--sidebar-active);
      color: var(--primary);
      font-weight: 650;
    }
    .nav-item.active::before {
      content: '';
      position: absolute;
      left: -10px;
      top: 20%;
      bottom: 20%;
      width: 3px;
      border-radius: 0 3px 3px 0;
      background: var(--primary);
    }
    .nav-icon {
      width: 20px;
      text-align: center;
      filter: saturate(0.6);
    }
    .nav-item.active .nav-icon {
      filter: none;
    }
    .sidebar-collapsed .nav-label,
    .sidebar-collapsed .brand-name,
    .sidebar-collapsed .sidebar-footer,
    .sidebar-collapsed .nav-section-label {
      display: none;
    }
    .sidebar-footer {
      padding: 14px 16px;
      border-top: 1px solid var(--sidebar-border);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .sidebar-footer .side-name {
      font-size: 12.5px;
      font-weight: 600;
      color: var(--sidebar-text-active);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .sidebar-footer .side-role {
      align-self: flex-start;
      font-size: 10.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--primary);
      background: var(--sidebar-active);
      border-radius: 999px;
      padding: 2px 10px;
    }
    .sidebar .nav::-webkit-scrollbar-thumb {
      background: var(--border);
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
      padding: 0 20px;
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 10;
      backdrop-filter: blur(12px);
      background: color-mix(in srgb, var(--surface) 82%, transparent);
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
      border-radius: 999px;
      padding: 7px 12px;
      font-size: 13px;
      color: var(--text-secondary);
      cursor: pointer;
      font-family: inherit;
      transition: border-color 0.14s, background 0.14s, box-shadow 0.14s;
    }
    .search-trigger:hover {
      border-color: var(--primary);
      background: var(--surface);
      color: var(--text);
      box-shadow: 0 0 0 3px var(--primary-soft);
    }
    .search-trigger kbd {
      font-family: inherit;
      font-size: 11px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 5px;
      padding: 1px 6px;
      color: var(--text-disabled);
    }
    .icon-btn {
      min-width: 38px;
      justify-content: center;
      border-radius: 999px;
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
      transition: transform 0.12s, box-shadow 0.12s;
    }
    .avatar:hover {
      transform: scale(1.05);
      box-shadow: 0 0 0 4px var(--primary-soft);
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
  private readonly perms = inject(PermissionsService);
  readonly collapsed = signal(this.prefs.current().sidebarCollapsed);
  readonly dark = signal(this.prefs.current().theme === 'dark');
  readonly mobileOpen = signal(false);
  readonly menuOpen = signal(false);

  readonly visibleNav = computed(() => navForModules(this.perms.matrix()));
  readonly navSections = computed<NavSection[]>(() => groupNav(this.visibleNav()));

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
    void this.perms.ensureLoaded();
  }

  go(path: string): void {
    this.menuOpen.set(false);
    this.router.navigate([path]);
  }

  skipToContent(e: MouseEvent): void {
    e.preventDefault();
    document.getElementById('main')?.focus();
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
