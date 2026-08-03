import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TabsService } from '../services/tabs.service';
import { itemForPath } from '../navigation';

@Component({
  selector: 'app-dynamic-tabs',
  template: `
    @if (tabs().length > 0) {
      <div class="tabs" role="tablist" aria-label="Módulos abiertos">
        @for (tab of tabs(); track tab.path) {
          <button
            class="tab"
            [class.active]="tab.path === active()"
            role="tab"
            [attr.aria-selected]="tab.path === active()"
            (click)="navigate(tab.path)"
          >
            <span class="icon" aria-hidden="true">{{ tab.icon }}</span>
            <span class="label">{{ tab.label }}</span>
            <span
              class="close"
              role="button"
              tabindex="0"
              aria-label="Cerrar {{ tab.label }}"
              (click)="close($event, tab.path)"
              (keydown.enter)="close($event, tab.path)"
            >✕</span>
          </button>
        }
        <span class="spacer"></span>
      </div>
    }
  `,
  styles: `
    .tabs {
      display: flex;
      align-items: flex-end;
      gap: 2px;
      padding: 6px 14px 0;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      overflow-x: auto;
      scrollbar-width: thin;
    }
    .spacer { flex: 1; }
    .tab {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      border: 1px solid var(--border);
      border-bottom: none;
      border-radius: 8px 8px 0 0;
      padding: 7px 10px;
      font-size: 12.5px;
      font-family: inherit;
      font-weight: 550;
      color: var(--text-secondary);
      background: var(--surface-2);
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.14s, color 0.14s;
      margin-right: 3px;
    }
    .tab:hover { color: var(--text); background: var(--surface-hover); }
    .tab.active {
      background: var(--surface);
      color: var(--text);
      box-shadow: inset 0 2px 0 var(--primary);
    }
    .tab .icon { font-size: 13px; }
    .tab .close {
      font-size: 10px;
      border-radius: 4px;
      padding: 0 3px;
      opacity: 0.55;
      line-height: 14px;
    }
    .tab .close:hover {
      opacity: 1;
      background: rgba(209, 53, 63, 0.14);
      color: var(--danger);
    }
  `,
})
export class DynamicTabsComponent {
  private readonly tabsService = inject(TabsService);
  readonly tabs = this.tabsService.list;
  readonly active = computed(() => {
    const url = this.router.url.split('?')[0];
    const item = itemForPath(url);
    return item?.path ?? '';
  });

  constructor(
    private router: Router,
  ) {}

  navigate(path: string): void {
    if (path !== this.active()) this.router.navigate([path]);
  }

  close(e: Event, path: string): void {
    e.stopPropagation();
    this.tabsService.close(path);
    if (this.active() === path) {
      const remaining = this.tabsService.list();
      const fallback = remaining[Math.min(remaining.length - 1, 0)]?.path ?? '/dashboard';
      this.router.navigate([fallback]);
    }
  }
}
