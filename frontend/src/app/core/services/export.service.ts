import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export type ExportFormat = 'csv' | 'xlsx' | 'pdf';

@Injectable({ providedIn: 'root' })
export class ExportService {
  constructor(
    private http: HttpClient,
    private api: ApiService,
  ) {}

  download(
    resource: string,
    format: ExportFormat,
    params?: Record<string, string | number | boolean | undefined>,
  ): Observable<HttpResponse<Blob>> {
    let p = new HttpParams().set('format', format);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') p = p.set(k, String(v));
      }
    }
    return this.http.get(`${this.api.baseUrl}/export/${resource}`, {
      params: p,
      responseType: 'blob',
      observe: 'response',
    });
  }

  saveFromResponse(res: HttpResponse<Blob>, fallbackName: string): void {
    const name = this.filenameFromHeader(res) ?? fallbackName;
    const url = URL.createObjectURL(res.body as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  private filenameFromHeader(res: HttpResponse<Blob>): string | null {
    const cd = res.headers.get('Content-Disposition');
    if (!cd) return null;
    const utf = /filename\*=UTF-8''([^;]+)/i.exec(cd);
    if (utf) return decodeURIComponent(utf[1]);
    const plain = /filename="?([^"]+)"?/i.exec(cd);
    return plain ? plain[1] : null;
  }
}
