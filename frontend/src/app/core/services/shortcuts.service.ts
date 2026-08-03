import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ShortcutsService {
  readonly searchOpen = signal(false);

  readonly toggleTheme = new Subject<void>();
  readonly toggleSidebar = new Subject<void>();
  readonly openShortcutsHelp = new Subject<void>();

  private bound = false;

  constructor() {
    this.enable();
  }

  enable(): void {
    if (this.bound || typeof window === 'undefined') return;
    this.bound = true;
    window.addEventListener('keydown', this.onKeydown);
  }

  disable(): void {
    if (!this.bound) return;
    this.bound = false;
    window.removeEventListener('keydown', this.onKeydown);
  }

  openSearch(): void {
    this.searchOpen.set(true);
  }

  closeSearch(): void {
    this.searchOpen.set(false);
  }

  private onKeydown = (e: KeyboardEvent): void => {
    const tag = (e.target as HTMLElement | null)?.tagName ?? '';
    const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
    const mod = e.ctrlKey || e.metaKey;

    if (mod && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      this.openSearch();
      return;
    }
    if (mod && (e.key === 'd' || e.key === 'D')) {
      e.preventDefault();
      this.toggleTheme.next();
      return;
    }
    if (mod && (e.key === 'b' || e.key === 'B')) {
      e.preventDefault();
      this.toggleSidebar.next();
      return;
    }
    if (e.key === '/' && !typing) {
      e.preventDefault();
      this.openSearch();
      return;
    }
    if (e.key === '?' && mod && !typing) {
      e.preventDefault();
      this.openShortcutsHelp.next();
      return;
    }
    if (e.key === 'Escape') {
      this.closeSearch();
    }
  };
}
