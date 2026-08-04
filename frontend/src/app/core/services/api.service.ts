import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiEnvelope } from '../models';

export interface QueryParams {
  page?: number;
  pageSize?: number;
  q?: string;
  [key: string]: string | number | boolean | undefined;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  /**
   * Base del API. Usa `window.__API_ORIGIN__` (definido en index.html para
   * Firebase Hosting u otros hosts sin proxy); por defecto `/api` (dev/Netlify).
   */
  readonly baseUrl = ((): string => {
    const origin = (window as { __API_ORIGIN__?: string }).__API_ORIGIN__;
    return `${origin ? origin.replace(/\/+$/, '') : ''}/api`;
  })();

  constructor(private http: HttpClient) {}

  private unwrap<T>(obs: Observable<ApiEnvelope<T>>): Observable<T> {
    return obs.pipe(map((env) => env.data));
  }

  private params(query?: QueryParams): HttpParams {
    let p = new HttpParams();
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null && v !== '') {
          p = p.set(k, String(v));
        }
      }
    }
    return p;
  }

  get<T>(path: string, query?: QueryParams): Observable<T> {
    return this.unwrap(
      this.http.get<ApiEnvelope<T>>(this.baseUrl + path, { params: this.params(query) }),
    );
  }

  post<T>(path: string, body?: unknown): Observable<T> {
    return this.unwrap(this.http.post<ApiEnvelope<T>>(this.baseUrl + path, body ?? {}));
  }

  patch<T>(path: string, body?: unknown): Observable<T> {
    return this.unwrap(this.http.patch<ApiEnvelope<T>>(this.baseUrl + path, body ?? {}));
  }

  delete<T>(path: string): Observable<T> {
    return this.unwrap(this.http.delete<ApiEnvelope<T>>(this.baseUrl + path));
  }

  rawPost<T>(path: string, body?: unknown): Observable<T> {
    return this.http.post<T>(this.baseUrl + path, body ?? {});
  }

  download(path: string): Observable<Blob> {
    return this.http.get(this.baseUrl + path, { responseType: 'blob' });
  }
}
