import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  template: `
    <div class="empty">
      <div class="icon" aria-hidden="true">{{ icon() }}</div>
      <div class="title">{{ title() }}</div>
      @if (hint()) {
        <div class="hint muted small">{{ hint() }}</div>
      }
      <ng-content />
    </div>
  `,
  styles: `
    .empty {
      text-align: center;
      padding: 48px 20px;
      color: var(--text-secondary);
    }
    .icon {
      font-size: 40px;
      margin-bottom: 8px;
      opacity: 0.5;
    }
    .title {
      font-weight: 600;
      color: var(--text);
      margin-bottom: 4px;
    }
    .hint {
      max-width: 340px;
      margin: 0 auto 14px;
    }
  `,
})
export class EmptyStateComponent {
  readonly icon = input('📭');
  readonly title = input('Sin resultados');
  readonly hint = input('');
}
