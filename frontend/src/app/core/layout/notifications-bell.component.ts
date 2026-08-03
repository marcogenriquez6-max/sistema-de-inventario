import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NotificationsService } from '../services/notifications.service';

@Component({
  selector: 'app-notifications-bell',
  imports: [DatePipe],
  template: `
    <div class="bell-wrap">
      <button
        class="bell"
        (click)="open.set(!open())"
        [attr.aria-label]="unread() > 0 ? unread() + ' notificaciones sin leer' : 'Notificaciones'"
        aria-haspopup="menu"
      >
        🔔
        @if (unread() > 0) {
          <span class="badge">{{ unread() > 9 ? '9+' : unread() }}</span>
        }
      </button>

      @if (open()) {
        <div class="panel" role="menu">
          <div class="head">
            <span class="title">Notificaciones</span>
            <button class="link" (click)="readAll()">Marcar todas leídas</button>
          </div>
          <div class="live">
            <span class="dot" [class.on]="connected()"></span>
            {{ connected() ? 'Tiempo real conectado' : 'Conectando…' }}
          </div>
          <div class="list">
            @for (n of notif.items(); track n.id) {
              <button class="item" [class.unread]="!n.isRead" (click)="notif.markRead(n.id)">
                <span class="ic" aria-hidden="true">{{ icon(n.type) }}</span>
                <span class="body">
                  <span class="t">{{ n.title }}</span>
                  @if (n.message) {
                    <span class="m">{{ n.message }}</span>
                  }
                  <span class="date">{{ n.createdAt | date: 'dd/MM HH:mm' }}</span>
                </span>
              </button>
            } @empty {
              <div class="empty">Sin notificaciones</div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .bell-wrap { position: relative; }
    .bell {
      position: relative;
      width: 36px;
      height: 36px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: var(--surface-2);
      cursor: pointer;
      font-size: 15px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .bell:hover { background: var(--surface-hover); }
    .badge {
      position: absolute;
      top: -6px;
      right: -6px;
      background: var(--danger);
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      min-width: 17px;
      height: 17px;
      border-radius: 999px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
    }
    .panel {
      position: absolute;
      right: 0;
      top: calc(100% + 8px);
      width: 340px;
      max-width: calc(100vw - 24px);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow-md);
      z-index: 40;
      overflow: hidden;
      animation: pop 0.12s ease;
    }
    @keyframes pop {
      from { opacity: 0; transform: translateY(-6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px;
      border-bottom: 1px solid var(--border);
    }
    .title { font-weight: 650; }
    .link {
      border: none;
      background: transparent;
      color: var(--primary);
      font-size: 12px;
      cursor: pointer;
      font-family: inherit;
    }
    .live {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: var(--text-secondary);
      padding: 6px 14px;
      border-bottom: 1px solid var(--border);
    }
    .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--warning);
    }
    .dot.on { background: var(--success); }
    .list { max-height: 340px; overflow-y: auto; padding: 4px; }
    .item {
      display: flex;
      gap: 10px;
      width: 100%;
      text-align: left;
      border: none;
      background: transparent;
      color: var(--text);
      padding: 10px 12px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-family: inherit;
    }
    .item:hover { background: var(--surface-hover); }
    .item.unread { background: rgba(30, 111, 217, 0.08); }
    .ic { font-size: 16px; }
    .body { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .t { font-weight: 600; font-size: 13px; }
    .m { font-size: 12px; color: var(--text-secondary); }
    .date { font-size: 11px; color: var(--text-disabled); }
    .empty { padding: 30px; text-align: center; color: var(--text-secondary); font-size: 13px; }
    @media (max-width: 480px) {
      .panel { width: calc(100vw - 24px); }
    }
  `,
})
export class NotificationsBellComponent {
  readonly notif = inject(NotificationsService);
  readonly open = signal(false);
  readonly unread = this.notif.unread;
  readonly connected = this.notif.connected;

  readAll(): void {
    void this.notif.markAllRead();
  }

  icon(type: string): string {
    switch (type) {
      case 'SALE':
        return '🧾';
      case 'PURCHASE':
        return '📥';
      case 'LOW_STOCK':
        return '⚠️';
      case 'CHAT':
        return '💬';
      default:
        return '🔔';
    }
  }
}
