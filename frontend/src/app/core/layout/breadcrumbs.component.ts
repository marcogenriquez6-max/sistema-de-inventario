import { Component, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { Crumb, crumbsForUrl } from '../navigation';

@Component({
  selector: 'app-breadcrumbs',
  imports: [RouterLink],
  template: `
    <nav class="crumbs" aria-label="Ruta de navegación">
      @for (crumb of crumbs(); track $index) {
        @if ($last) {
          <span class="crumb current" aria-current="page">{{ crumb.label }}</span>
        } @else {
          <a class="crumb" [routerLink]="crumb.path">{{ crumb.label }}</a>
          <span class="sep" aria-hidden="true">/</span>
        }
      }
    </nav>
  `,
  styles: `
    .crumbs {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12.5px;
      white-space: nowrap;
      overflow: hidden;
      min-width: 0;
    }
    .crumb {
      color: var(--text-secondary);
      text-decoration: none;
    }
    .crumb:hover {
      color: var(--primary);
    }
    .crumb.current {
      color: var(--text);
      font-weight: 600;
    }
    .sep {
      color: var(--text-disabled);
    }
  `,
})
export class BreadcrumbsComponent {
  readonly crumbs = signal<Crumb[]>([]);

  constructor(router: Router) {
    router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.crumbs.set(crumbsForUrl(router.url)));
  }
}
