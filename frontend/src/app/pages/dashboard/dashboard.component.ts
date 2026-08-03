import { Component, inject, signal, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { StatusChipComponent } from '../../shared/status-chip.component';
import { NgApexchartsModule, ApexOptions, ApexChart } from 'ng-apexcharts';

interface DashboardSummary {
  todaySales: { count: number; total: number };
  monthSales: { count: number; total: number };
  lowStockCount: number;
  totalProducts: number;
  totalStockValue: number;
  lowStockProducts: {
    id: number;
    sku: string;
    name: string;
    stock: number;
    minStock: number;
    salePrice: string;
  }[];
  recentSales: {
    id: number;
    docNumber: string;
    docType: string;
    total: string;
    customerName: string;
    createdAt: string;
  }[];
}

interface SalesPoint {
  day: string;
  total: number;
  count: number;
}

interface ModuleStatusSummary {
  enabledCount: number;
  totalCount: number;
  modules: Array<{
    name: string;
    slug: string;
    enabled: boolean;
    description: string;
    category: string;
  }>;
}

@Component({
  selector: 'app-dashboard',
  imports: [StatusChipComponent, NgApexchartsModule, CommonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Dashboard</h1>
          <p class="muted small">Visión general del negocio</p>
        </div>
      </div>

      <div class="stat-grid">
        <div class="stat stat-highlight">
          <div class="label">Ventas hoy</div>
          <div class="value">Bs {{ dash()?.todaySales?.total | number: '1.2-2' }}</div>
          <div class="sub">{{ dash()?.todaySales?.count ?? 0 }} documentos</div>
        </div>
        <div class="stat">
          <div class="label">Ventas del mes</div>
          <div class="value">Bs {{ dash()?.monthSales?.total | number: '1.2-2' }}</div>
          <div class="sub">{{ dash()?.monthSales?.count ?? 0 }} documentos</div>
        </div>
        <div class="stat">
          <div class="label">Valor del inventario</div>
          <div class="value">Bs {{ dash()?.totalStockValue | number: '1.2-2' }}</div>
          <div class="sub">{{ dash()?.totalProducts ?? 0 }} productos activos</div>
        </div>
        <div
          class="stat"
          style="border-color: {{ dash()?.lowStockCount ? 'var(--warning)' : 'var(--border)' }}"
        >
          <div class="label">Stock crítico</div>
          <div
            class="value"
            [style.color]="dash()?.lowStockCount ? 'var(--warning)' : 'var(--success)'"
          >
            {{ dash()?.lowStockCount }}
          </div>
          <div class="sub">requieren reposición</div>
        </div>
      </div>

      <div class="card card-pad" style="margin-top:16px">
        <div class="card-header">
          <div>
            <h3>Estado del ERP</h3>
            <p class="muted small">Módulos activos y cobertura operativa</p>
          </div>
          <div class="pill">{{ moduleState()?.enabledCount ?? 0 }}/{{ moduleState()?.totalCount ?? 0 }} activos</div>
        </div>
        @if ((moduleState()?.modules ?? []).length) {
          <div class="module-grid">
            @for (module of moduleState()?.modules ?? []; track module.slug) {
              <div class="module-card">
                <div class="module-top">
                  <strong>{{ module.name }}</strong>
                  <span class="chip" [class.chip-success]="module.enabled" [class.chip-neutral]="!module.enabled">
                    {{ module.enabled ? 'Activo' : 'Desactivado' }}
                  </span>
                </div>
                <p class="muted small">{{ module.description }}</p>
              </div>
            }
          </div>
        }
      </div>

      <div class="card card-pad" style="margin-top:16px">
        <h3>Ventas de los últimos 14 días</h3>
        @if (chart.series().length) {
          <apx-chart
            [chart]="chart.chart"
            [series]="chart.series()"
            [xaxis]="chart.xaxis"
            [colors]="chart.colors"
            [dataLabels]="chart.dataLabels"
            [tooltip]="chart.tooltip"
          ></apx-chart>
        } @else {
          <p class="muted small">Sin ventas registradas en el período.</p>
        }
      </div>

      <div class="grid-2">
        <div class="card card-pad">
          <h3>Stock crítico</h3>
          @if ((dash()?.lowStockProducts ?? []).length === 0) {
            <p class="muted small">No hay productos bajo stock mínimo.</p>
          }
          <table class="data">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Producto</th>
                <th>Stock</th>
                <th>Mín.</th>
              </tr>
            </thead>
            <tbody>
              @for (p of dash()?.lowStockProducts ?? []; track p.id) {
                <tr>
                  <td class="mono">{{ p.sku }}</td>
                  <td>{{ p.name }}</td>
                  <td><app-status-chip [value]="'LOW_STOCK'" /></td>
                  <td>{{ p.stock }} / {{ p.minStock }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="card card-pad">
          <h3>Últimas ventas</h3>
          @if ((dash()?.recentSales ?? []).length === 0) {
            <p class="muted small">Sin ventas recientes.</p>
          }
          <table class="data">
            <thead>
              <tr>
                <th>Doc</th>
                <th>Cliente</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              @for (s of dash()?.recentSales ?? []; track s.id) {
                <tr>
                  <td class="mono">{{ s.docNumber }}</td>
                  <td>{{ s.customerName }}</td>
                  <td>Bs {{ s.total | number: '1.2-2' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: `
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-top: 16px;
    }
    .stat-highlight {
      border-color: var(--primary);
      box-shadow: 0 10px 30px rgba(30, 111, 217, 0.12);
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }
    .pill {
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 999px;
      padding: 6px 10px;
      font-size: 12px;
      color: var(--text-secondary);
    }
    .module-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
    }
    .module-card {
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 12px;
      background: var(--surface-2);
    }
    .module-top {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      align-items: center;
      margin-bottom: 6px;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      padding: 3px 8px;
      font-size: 11px;
      font-weight: 600;
    }
    .chip-success {
      background: rgba(26, 143, 92, 0.14);
      color: var(--success);
    }
    .chip-neutral {
      background: rgba(90, 107, 133, 0.14);
      color: var(--text-secondary);
    }
    @media (max-width: 980px) {
      .grid-2 {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class DashboardComponent implements AfterViewInit {
  private api = inject(ApiService);
  dash = signal<DashboardSummary | null>(null);
  moduleState = signal<ModuleStatusSummary | null>(null);

  chart = {
    chart: {
      type: 'area',
      height: 260,
      toolbar: { show: false },
      zoom: { enabled: false },
    } as ApexChart,
    series: signal<{ name: string; data: number[] }[]>([]),
    xaxis: { categories: [] as string[] },
    colors: ['#1e6fd9'],
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (v: number) => `Bs ${v.toFixed(2)}` } },
  };

  ngAfterViewInit(): void {
    this.api.get<DashboardSummary>('/reports/dashboard').subscribe({
      next: (d) => {
        this.dash.set(d);
        this.loadChart();
      },
    });

    this.api.get<ModuleStatusSummary>('/health/modules').subscribe({
      next: (modules) => this.moduleState.set(modules),
    });
  }

  private loadChart(): void {
    const now = new Date();
    const from = new Date(now.getTime() - 13 * 86400000).toISOString().slice(0, 10);
    const to = now.toISOString().slice(0, 10);
    this.api.get<SalesPoint[]>('/reports/sales-by-day', { from, to }).subscribe({
      next: (points) => {
        this.chart.series.set([{ name: 'Ventas (Bs)', data: points.map((p) => p.total) }]);
        this.chart.xaxis.categories = points.map((p) => p.day.slice(5));
      },
    });
  }
}
