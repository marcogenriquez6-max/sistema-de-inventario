import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

export type PermissionMatrix = Record<string, Record<string, boolean>>;

interface MatrixResponse {
  modules: string[];
  matrix: Record<string, boolean>;
}

interface FullMatrixResponse {
  roles: string[];
  modules: string[];
  matrix: PermissionMatrix;
}

/**
 * Permisos por rol del usuario autenticado. La matriz viaja desde el backend
 * (setting `role_permissions`) y controla el menú y los guards de rutas.
 */
@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  private raw = signal<Record<string, boolean>>({});
  private loading = signal(false);
  private loadedOnce = false;

  readonly modules = signal<string[]>([]);
  readonly ready = signal(false);

  readonly matrix = computed<Record<string, boolean>>(() => {
    const role = this.auth.role();
    if (!role) return {};
    if (role === 'ADMIN') return this.allTrue();
    return this.raw();
  });

  readonly can = (module: string): boolean => this.matrix()[module] === true;

  async ensureLoaded(): Promise<void> {
    if (this.loadedOnce || this.loading()) return;
    this.loading.set(true);
    try {
      const res = await this.api.get<MatrixResponse>('/permissions/matrix').toPromise();
      if (res) {
        this.raw.set(res.matrix);
        this.modules.set(res.modules);
      }
    } catch {
      this.raw.set({});
    } finally {
      this.loadedOnce = true;
      this.loading.set(false);
      this.ready.set(true);
    }
  }

  /** Matriz completa (solo ADMIN). */
  getFull(): Promise<FullMatrixResponse | undefined> {
    return this.api.get<FullMatrixResponse>('/permissions').toPromise();
  }

  save(matrix: PermissionMatrix): Promise<unknown> {
    return this.api.patch('/permissions', { matrix }).toPromise();
  }

  reset(): Promise<unknown> {
    return this.api.post('/permissions/reset').toPromise();
  }

  refresh(): void {
    this.loadedOnce = false;
    void this.ensureLoaded();
  }

  private allTrue(): Record<string, boolean> {
    const out: Record<string, boolean> = {};
    for (const m of this.modules()) out[m] = true;
    return out;
  }
}
