import { effect, Injectable, signal } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

export interface ChatUser {
  id: number;
  name: string;
  role: string;
}

export interface ChatParticipant {
  id: number;
  name: string;
  role: string;
}

export interface ChatRoom {
  id: number;
  type: string;
  name: string | null;
  createdAt: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  lastSender: string | null;
  unreadCount: number;
  participants: ChatParticipant[];
}

export interface ChatMessageItem {
  id: number;
  roomId: number;
  senderId: number;
  content: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  readonly rooms = signal<ChatRoom[]>([]);
  readonly messages = signal<ChatMessageItem[]>([]);
  readonly unread = signal(0);
  readonly connected = signal(false);
  readonly loading = signal(false);
  readonly activeRoomId = signal<number | null>(null);

  private controller: AbortController | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly POLL_MS = 60_000;

  constructor(
    private api: ApiService,
    private auth: AuthService,
  ) {
    effect(() => {
      const token = this.auth.token();
      if (token) {
        this.loadRooms();
        this.loadUnread();
        this.connect();
      } else {
        this.disconnect();
      }
    });
  }

  loadRooms(): void {
    this.api.get<ChatRoom[]>('/chat/rooms').subscribe({
      next: (rooms) => {
        this.rooms.set(rooms);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  loadUnread(): void {
    this.api.get<number>('/chat/unread-count').subscribe({
      next: (n) => this.unread.set(Number(n)),
      error: () => undefined,
    });
  }

  async loadHistory(roomId: number): Promise<void> {
    this.activeRoomId.set(Number(roomId));
    this.messages.set([]);
    this.api.get<ChatMessageItem[]>(`/chat/rooms/${roomId}/messages`, { limit: 100 }).subscribe({
      next: (msgs) => this.messages.set(msgs),
      error: () => this.messages.set([]),
    });
  }

  async openRoom(roomId: number): Promise<void> {
    await this.loadHistory(roomId);
    await this.markRead(roomId);
  }

  async markRead(roomId: number): Promise<void> {
    await this.api.post(`/chat/rooms/${roomId}/read`).toPromise().catch(() => undefined);
    this.rooms.set(
      this.rooms().map((r) => (Number(r.id) === Number(roomId) ? { ...r, unreadCount: 0 } : r)),
    );
    await this.loadUnread();
  }

  async send(roomId: number, content: string): Promise<boolean> {
    try {
      const msg = await this.api
        .post<ChatMessageItem>(`/chat/rooms/${roomId}/messages`, { content })
        .toPromise();
      if (!msg) return false;
      this.messages.set([...this.messages(), msg]);
      this.rooms.set(
        this.rooms().map((r) =>
          Number(r.id) === Number(roomId)
            ? { ...r, lastMessage: content, lastMessageAt: msg.createdAt }
            : r,
        ),
      );
      return true;
    } catch {
      return false;
    }
  }

  async createRoom(type: 'direct' | 'group', participantIds: number[], name?: string): Promise<ChatRoom | null> {
    try {
      const room = await this.api
        .post<ChatRoom>('/chat/rooms', { type, name, participantIds })
        .toPromise();
      if (!room) return null;
      this.rooms.set([...this.rooms(), room]);
      return room;
    } catch {
      return null;
    }
  }

  availableUsers(q?: string): Promise<ChatUser[]> {
    return this.api.get<ChatUser[]>('/chat/users', { q }).toPromise().then((u) => u ?? []);
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
      if (!this.controller) {
        this.loadRooms();
        this.loadUnread();
      }
    }, this.POLL_MS);
  }

  private async openStream(controller: AbortController, token: string): Promise<void> {
    try {
      const res = await fetch(this.api.baseUrl + '/chat/stream', {
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
            const parsed = JSON.parse(dataLine.slice(5).trim()) as {
              type: string;
              data: ChatMessageItem;
            };
            const msg = parsed.data;
            const inOpenRoom = Number(msg.roomId) === this.activeRoomId();
            if (inOpenRoom) {
              this.messages.set([...this.messages(), msg]);
              void this.markRead(msg.roomId);
            } else {
              this.rooms.set(
                this.rooms().map((r) =>
                  Number(r.id) === Number(msg.roomId)
                    ? {
                        ...r,
                        lastMessage: msg.content,
                        lastMessageAt: msg.createdAt,
                        unreadCount: Number(r.unreadCount) + 1,
                      }
                    : r,
                ),
              );
              this.loadUnread();
            }
          } catch {
            /* evento malformado */
          }
        }
      }
    } catch {
      /* reconexión */
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
