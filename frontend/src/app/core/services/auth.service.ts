import { Injectable, computed, signal } from '@angular/core';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import { AuthSession, AuthTokens, Role, User } from '../models';

export interface AuthState {
  user: User | null;
  token: string | null;
  ready: boolean;
}

const INITIAL: AuthState = { user: null, token: null, ready: false };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private state = signal<AuthState>(INITIAL);

  readonly user = computed(() => this.state().user);
  readonly token = computed(() => this.state().token);
  readonly ready = computed(() => this.state().ready);
  readonly isAuthenticated = computed(() => !!this.state().token);
  readonly role = computed(() => this.state().user?.role ?? null);

  hasRole(...roles: Role[]): boolean {
    const r = this.state().user?.role;
    return !!r && roles.includes(r);
  }

  constructor(
    private api: ApiService,
    private storage: StorageService,
  ) {
    this.restore();
  }

  restore(): void {
    const token = this.storage.getAccessToken();
    const user = this.storage.getUser<User>();
    this.state.set({ user, token, ready: true });
  }

  async login(email: string, password: string): Promise<void> {
    const session = await this.api
      .post<AuthSession>('/auth/login', { email, password })
      .toPromise();
    if (!session) return;
    this.applySession(session);
  }

  async refresh(): Promise<boolean> {
    const refresh = this.storage.getRefreshToken();
    if (!refresh) return false;
    try {
      const tokens = await this.api
        .rawPost<AuthTokens>('/auth/refresh', { refreshToken: refresh })
        .toPromise();
      if (!tokens) return false;
      this.storage.setTokens(tokens.accessToken, tokens.refreshToken);
      const user = this.storage.getUser<User>();
      this.state.set({ user, token: tokens.accessToken, ready: true });
      return true;
    } catch {
      this.logout();
      return false;
    }
  }

  async logout(): Promise<void> {
    const refresh = this.storage.getRefreshToken();
    if (refresh) {
      this.api
        .rawPost('/auth/logout', { refreshToken: refresh })
        .toPromise()
        .catch(() => undefined);
    }
    this.storage.clear();
    this.state.set(INITIAL);
  }

  private applySession(session: AuthSession): void {
    this.storage.setTokens(session.tokens.accessToken, session.tokens.refreshToken);
    this.storage.setUser(session.user);
    this.state.set({ user: session.user, token: session.tokens.accessToken, ready: true });
  }
}
