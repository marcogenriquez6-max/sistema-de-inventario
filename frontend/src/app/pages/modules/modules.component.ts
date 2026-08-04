import { Component, inject, signal } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { ModuleCatalogComponent } from '../../shared/module-catalog.component';

interface ModuleState {
  enabledCount: number;
  totalCount: number;
  modules: Array<{ name: string; slug: string; enabled: boolean; description: string; category: string }>;
}

@Component({
  selector: 'app-modules',
  imports: [ModuleCatalogComponent],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Módulos del sistema</h1>
          <p class="muted small">
            Qué hace Repuestos ERP y qué módulos incluye: operaciones, finanzas y soporte en una sola plataforma.
          </p>
        </div>
      </div>

      <div class="stat-grid">
        <div class="stat">
          <div class="label">Módulos incluidos</div>
          <div class="value">{{ state()?.totalCount ?? '…' }}</div>
        </div>
        <div class="stat">
          <div class="label">Activos</div>
          <div class="value">{{ state()?.enabledCount ?? '…' }}</div>
        </div>
        <div class="stat">
          <div class="label">Áreas funcionales</div>
          <div class="value">4</div>
        </div>
        <div class="stat">
          <div class="label">Cobertura</div>
          <div class="value">Comercial-financiera</div>
        </div>
      </div>

      <div class="card card-pad">
        <app-module-catalog />
      </div>
    </div>
  `,
  styles: ``,
})
export class ModulesComponent {
  private api = inject(ApiService);
  readonly state = signal<ModuleState | null>(null);

  constructor() {
    this.api.get<ModuleState>('/health/modules').subscribe({
      next: (s) => this.state.set(s),
    });
  }
}
