import { effect, Injectable, signal } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { PushNotificationsService } from './push-notifications.service';

export interface NotifItem {
  id: number;
  type: string;
  title: string;
  message: string | null;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  readonly items = signal<NotifItem[]>([]);
  readonly unread = signal(0);
  readonly connected = signal(false);
  readonly loading = signal(false);

  private controller: AbortController | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly POLL_MS = 60_000;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private push: PushNotificationsService,
  ) {
    effect(() => {
      const token = this.auth.token();
      if (token) {
        this.load();
        this.connect();
        void this.push.init();
      } else {
        this.disconnect();
      }
    });
  }

  load(): void {
    this.loading.set(true);
    this.api.get<{ items: NotifItem[]; total: number; unread: number }>('/notifications').subscribe({
      next: (res) => {
        this.items.set(res.items);
        this.unread.set(res.unread);
        this.loading.set(false);
        this.schedulePoll();
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  async markRead(id: number): Promise<void> {
    await this.api.patch(`/notifications/read/${id}`).toPromise().catch(() => undefined);
    this.items.set(this.items().map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    this.unread.set(Math.max(this.unread() - 1, 0));
  }

  async markAllRead(): Promise<void> {
    await this.api.post('/notifications/read-all').toPromise().catch(() => undefined);
    this.items.set(this.items().map((n) => ({ ...n, isRead: true })));
    this.unread.set(0);
  }

  connect(): void {
    if (this.controller) return;
    const token = this.auth.token();
    if (!token) return;
    const controller = new AbortController();
    this.controller = controller;
    void this.openStream(controller, token);
  }

  disconnect(): void {
    this.controller?.abort();
    this.controller = null;
    this.connected.set(false);
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private schedulePoll(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (!this.controller) this.load();
    }, this.POLL_MS);
  }

  private async openStream(controller: AbortController, token: string): Promise<void> {
    try {
      const res = await fetch(this.api.baseUrl + '/notifications/stream', {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error(`SSE ${res.status}`);
      this.connected.set(true);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';
        for (const evt of events) {
          const dataLine = evt.split('\n').find((l) => l.startsWith('data:'));
          if (!dataLine) continue;
          try {
            const notif = JSON.parse(dataLine.slice(5).trim()) as NotifItem;
            this.items.set([notif, ...this.items()]);
            this.unread.set(this.unread() + 1);
          } catch {
            /* ignorar evento malformado */
          }
        }
      }
    } catch {
      /* conexión cerrada o error */
    } finally {
      if (this.controller === controller) {
        this.controller = null;
        this.connected.set(false);
        setTimeout(() => {
          if (this.auth.token()) this.connect();
        }, 3000);
      }
    }
  }
}
