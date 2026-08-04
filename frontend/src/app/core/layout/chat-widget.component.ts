import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatUser } from '../services/chat.service';
import { AuthService } from '../services/auth.service';
import { FocusTrapDirective } from '../directives/focus-trap.directive';

@Component({
  selector: 'app-chat-widget',
  imports: [DatePipe, FormsModule, FocusTrapDirective],
  template: `
    <div class="chat-fab" [class.open]="panelOpen()">
      <button
        class="fab"
        (click)="toggle()"
        [attr.aria-label]="chat.unread() > 0 ? 'Chat, ' + chat.unread() + ' mensajes sin leer' : 'Abrir chat'"
        aria-haspopup="dialog"
      >
        <span class="fab-icon" aria-hidden="true">{{ panelOpen() ? '✕' : '💬' }}</span>
        @if (chat.unread() > 0) {
          <span class="badge">{{ chat.unread() > 9 ? '9+' : chat.unread() }}</span>
        }
      </button>

      @if (panelOpen()) {
        <section
          class="panel"
          role="dialog"
          aria-label="Chat interno"
          focusTrap
          (focusTrapEscape)="panelOpen.set(false)"
        >
          <header class="head">
            <span class="title">
              @if (room()) {
                <button class="back" (click)="back()" aria-label="Volver a salas">←</button>
                {{ roomTitle() }}
              } @else {
                Chat interno
              }
            </span>
            <div class="live">
              <span class="dot" [class.on]="chat.connected()"></span>
              {{ chat.connected() ? 'en línea' : 'reconectando…' }}
            </div>
          </header>

          @if (!room()) {
            <div class="rooms">
              <button class="new-chat" (click)="newChat.set(true)">
                <span aria-hidden="true">✚</span> Nuevo mensaje
              </button>

              @if (newChat()) {
                <div class="picker">
                  <input
                    class="search"
                    [(ngModel)]="q"
                    placeholder="Buscar usuario…"
                    (ngModelChange)="searchUsers()"
                  />
                  <div class="users">
                    @for (u of users(); track u.id) {
                      <button class="user" (click)="startDirect(u)">
                        <span class="avatar">{{ u.name.charAt(0) }}</span>
                        <span class="u-name">{{ u.name }}</span>
                        <span class="chip chip-neutral">{{ u.role }}</span>
                      </button>
                    } @empty {
                      <div class="empty">Sin usuarios</div>
                    }
                  </div>
                </div>
              }

              <div class="room-list">
                @for (r of chat.rooms(); track r.id) {
                  <button class="room" (click)="openRoom(r.id)">
                    <span class="avatar">{{ roomIcon(r) }}</span>
                    <span class="body">
                      <span class="r-name">{{ roomName(r) }}</span>
                      <span class="r-last">{{ r.lastMessage ?? 'Sin mensajes' }}</span>
                    </span>
                    <span class="meta">
                      @if (hasUnread(r)) {
                        <span class="unread">{{ r.unreadCount }}</span>
                      }
                    </span>
                  </button>
                } @empty {
                  <div class="empty">No hay conversaciones</div>
                }
              </div>
            </div>
          } @else {
            <div class="messages" #scroll>
              @for (m of chat.messages(); track m.id) {
                <div class="msg" [class.mine]="isMine(m.senderId)">
                  <div class="bubble">
                    <div class="m-text">{{ m.content }}</div>
                    <div class="m-date">{{ m.createdAt | date: 'HH:mm' }}</div>
                  </div>
                </div>
              } @empty {
                <div class="empty">Envía el primer mensaje</div>
              }
            </div>

            <form class="composer" (ngSubmit)="submit()" novalidate>
              <input
                class="input"
                [(ngModel)]="draft"
                name="draft"
                placeholder="Escribe un mensaje…"
                autocomplete="off"
              />
              <button class="send" type="submit" [disabled]="!draft().trim()" aria-label="Enviar">➤</button>
            </form>
          }
        </section>
      }
    </div>
  `,
  styles: `
    .chat-fab { position: fixed; right: 18px; bottom: 18px; z-index: 50; }
    .fab {
      position: relative;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      border: none;
      background: var(--primary);
      color: var(--primary-contrast);
      font-size: 20px;
      cursor: pointer;
      box-shadow: var(--shadow-md);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.12s;
    }
    .fab:hover { transform: scale(1.06); }
    .badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: var(--danger);
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      min-width: 18px;
      height: 18px;
      border-radius: 999px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
    }
    .panel {
      position: absolute;
      right: 0;
      bottom: calc(100% + 12px);
      width: 360px;
      max-width: calc(100vw - 24px);
      height: 480px;
      max-height: calc(100vh - 120px);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow-md);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: pop 0.14s ease;
    }
    @keyframes pop {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px;
      border-bottom: 1px solid var(--border);
      gap: 8px;
    }
    .title { font-weight: 650; display: flex; align-items: center; gap: 6px; min-width: 0; }
    .back {
      border: none;
      background: var(--surface-2);
      border-radius: var(--radius-sm);
      width: 26px;
      height: 26px;
      cursor: pointer;
      font-size: 14px;
      flex-shrink: 0;
    }
    .live {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      color: var(--text-secondary);
      white-space: nowrap;
    }
    .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--warning); }
    .dot.on { background: var(--success); }
    .rooms { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
    .new-chat {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 8px;
      padding: 9px 12px;
      border: 1px dashed var(--border);
      background: transparent;
      color: var(--primary);
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-family: inherit;
      font-weight: 600;
      font-size: 13px;
    }
    .new-chat:hover { background: var(--primary-soft); }
    .picker { padding: 0 8px 8px; border-bottom: 1px solid var(--border); }
    .search {
      width: 100%;
      box-sizing: border-box;
      padding: 8px 10px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: var(--surface-2);
      color: var(--text);
      font-family: inherit;
      font-size: 13px;
    }
    .users { max-height: 180px; overflow-y: auto; margin-top: 6px; display: flex; flex-direction: column; gap: 2px; }
    .user {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      border: none;
      background: transparent;
      border-radius: var(--radius-sm);
      cursor: pointer;
      text-align: left;
      font-family: inherit;
    }
    .user:hover { background: var(--surface-hover); }
    .avatar {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: var(--primary);
      color: var(--primary-contrast);
      font-weight: 700;
      font-size: 13px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .u-name { flex: 1; font-size: 13px; color: var(--text); }
    .room-list { flex: 1; overflow-y: auto; }
    .room {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 10px 14px;
      border: none;
      background: transparent;
      cursor: pointer;
      text-align: left;
      font-family: inherit;
    }
    .room:hover { background: var(--surface-hover); }
    .room .avatar {
      background: var(--surface-2);
      border: 1px solid var(--border);
      color: var(--text);
      font-size: 14px;
    }
    .body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .r-name { font-weight: 600; font-size: 13px; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .r-last { font-size: 12px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .meta { flex-shrink: 0; }
    .unread {
      background: var(--primary);
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      min-width: 18px;
      height: 18px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0 5px;
    }
    .empty { padding: 30px; text-align: center; color: var(--text-secondary); font-size: 13px; }
    .messages { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 6px; }
    .msg { display: flex; }
    .msg.mine { justify-content: flex-end; }
    .bubble {
      max-width: 78%;
      padding: 8px 11px;
      border-radius: 12px;
      background: var(--surface-2);
      border: 1px solid var(--border);
      font-size: 13px;
      color: var(--text);
    }
    .msg.mine .bubble {
      background: var(--primary);
      border-color: var(--primary);
      color: var(--primary-contrast);
      border-bottom-right-radius: 4px;
    }
    .msg:not(.mine) .bubble { border-bottom-left-radius: 4px; }
    .m-text { white-space: pre-wrap; word-break: break-word; }
    .m-date { font-size: 10px; opacity: 0.75; margin-top: 3px; text-align: right; }
    .composer {
      display: flex;
      gap: 8px;
      padding: 10px;
      border-top: 1px solid var(--border);
    }
    .input {
      flex: 1;
      padding: 9px 12px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: var(--surface-2);
      color: var(--text);
      font-family: inherit;
      font-size: 13px;
    }
    .input:focus { outline: 2px solid var(--primary); outline-offset: 1px; }
    .send {
      width: 40px;
      border: none;
      border-radius: var(--radius-sm);
      background: var(--primary);
      color: var(--primary-contrast);
      cursor: pointer;
      font-size: 14px;
    }
    .send:disabled { opacity: 0.5; cursor: default; }
    @media (max-width: 480px) {
      .panel { width: calc(100vw - 24px); }
    }
  `,
})
export class ChatWidgetComponent {
  readonly chat = inject(ChatService);
  private readonly auth = inject(AuthService);
  readonly scroll = viewChild<ElementRef<HTMLDivElement>>('scroll');
  readonly panelOpen = signal(false);
  readonly newChat = signal(false);
  readonly q = signal('');
  readonly draft = signal('');
  readonly users = signal<ChatUser[]>([]);
  readonly room = signal<number | null>(null);

  readonly me = this.auth.user;

  isMine(senderId: unknown): boolean {
    return Number(senderId) === Number(this.me()?.id);
  }

  hasUnread(r: { unreadCount: number }): boolean {
    return Number(r.unreadCount) > 0;
  }

  roomName(r: { id: number; type: string; name: string | null; participants: Array<{ id: number; name: string }> }): string {
    if (r.name) return r.name;
    return r.participants
      .filter((p) => Number(p.id) !== Number(this.me()?.id))
      .map((p) => p.name)
      .join(', ') || 'Chat';
  }

  roomIcon(r: { type: string; participants: Array<{ id: number; name: string }> }): string {
    if (r.type === 'announcement') return '📢';
    if (r.type === 'group') return '👥';
    const other = r.participants.find((p) => Number(p.id) !== Number(this.me()?.id));
    return other?.name?.charAt(0).toUpperCase() ?? '?';
  }

  roomTitle(): string {
    const r = this.chat.rooms().find((x) => Number(x.id) === this.room());
    return r ? this.roomName(r) : '';
  }

  toggle(): void {
    this.panelOpen.set(!this.panelOpen());
    if (!this.panelOpen()) this.room.set(null);
  }

  back(): void {
    this.room.set(null);
    this.newChat.set(false);
    this.chat.loadRooms();
  }

  async openRoom(id: number): Promise<void> {
    this.room.set(Number(id));
    this.newChat.set(false);
    await this.chat.openRoom(Number(id));
    setTimeout(() => this.scrollToBottom(), 50);
  }

  async startDirect(u: ChatUser): Promise<void> {
    const existing = this.chat
      .rooms()
      .find(
        (r) =>
          r.type === 'direct' &&
          r.participants.length === 2 &&
          r.participants.some((p) => Number(p.id) === Number(u.id)),
      );
    if (existing) {
      await this.openRoom(existing.id);
      return;
    }
    const room = await this.chat.createRoom('direct', [u.id]);
    if (room) {
      await this.openRoom(room.id);
    }
  }

  async searchUsers(): Promise<void> {
    const list = await this.chat.availableUsers(this.q() || undefined);
    this.users.set(list ?? []);
  }

  async submit(): Promise<void> {
    const content = this.draft().trim();
    const roomId = this.room();
    if (!content || roomId === null) return;
    const ok = await this.chat.send(roomId, content);
    if (ok) this.draft.set('');
    setTimeout(() => this.scrollToBottom(), 50);
  }

  private scrollToBottom(): void {
    const el = this.scroll()?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }
}
