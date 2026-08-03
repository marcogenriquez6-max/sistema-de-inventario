import { Injectable } from '@angular/core';

const ACCESS_KEY = 'repuestos_access';
const REFRESH_KEY = 'repuestos_refresh';
const USER_KEY = 'repuestos_user';

@Injectable({ providedIn: 'root' })
export class StorageService {
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  }

  setTokens(access: string, refresh: string): void {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  }

  getUser<T>(): T | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  }

  setUser(user: unknown): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  clear(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  }
}
