import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule, ApexOptions, ApexChart } from 'ng-apexcharts';
import { ApiService } from '../../core/services/api.service';
import { ExportButtonComponent } from '../../shared/export-button.component';
import { BsPipe } from '../../shared/bs.pipe';

interface SalesPoint {
  day: string;
  total: number;
  count: number;
}

interface LowStockItem {
  id: number;
  sku: string;
  name: string;
  stock: number;
  minStock: number;
  salePrice: string;
}

interface LowStockResponse {
  items: LowStockItem[];
  total: number;
}

interface DashboardSummary {
  todaySales: { count: number; total: number };
  monthSales: { count: number; total: number };
  lowStockCount: number;
  totalProducts: number;
  totalStockValue: number;
}

@Component({
  selector: 'app-reports',
  imports: [FormsModule, NgApexchartsModule, CommonModule, ExportButtonComponent, BsPipe],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Reportes</h1>
          <p class="muted small">Análisis de ventas, inventario y stock crítico</p>
        </div>
        <app-export-button resource="sales" [params]="{ from: from, to: to }" />
        <app-export-button resource="purchases" [params]="{ from: from, to: to }" />
      </div>

      <div class="card card-pad">
        <div class="range">
          <div class="field inline">
            <label>Desde</label>
            <input class="input" type="date" [(ngModel)]="from" />
          </div>
          <div class="field inline">
            <label>Hasta</label>
            <input class="input" type="date" [(ngModel)]="to" />
          </div>
          <button class="btn btn-primary" (click)="generate()">Generar</button>
        </div>
      </div>

      <div class="stat-grid" style="margin-top:16px">
        <div class="stat">
          <div class="label">Total del período</div>
          <div class="value">{{ periodTotal() | bs }}</div>
          <div class="sub">{{ points().length }} días analizados</div>
        </div>
        <div class="stat">
          <div class="label">Documentos del período</div>
          <div class="value">{{ periodDocs() }}</div>
          <div class="sub">ventas registradas</div>
        </div>
        <div class="stat">
          <div class="label">Stock crítico</div>
          <div
            class="value"
            [style.color]="dash()?.lowStockCount ? 'var(--warning)' : 'var(--success)'"
          >
            {{ dash()?.lowStockCount ?? 0 }}
          </div>
          <div class="sub">requieren reposición</div>
        </div>
        <div class="stat">
          <div class="label">Valor del inventario</div>
          <div class="value">{{ dash()?.totalStockValue | bs }}</div>
          <div class="sub">{{ dash()?.totalProducts ?? 0 }} productos</div>
        </div>
      </div>

      <div class="card card-pad" style="margin-top:16px">
        <h3>Ventas por día</h3>
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

      <div class="card" style="margin-top:16px">
        <div class="card-pad" style="padding-bottom:0">
          <h3>Stock crítico</h3>
          <p class="muted small">Productos por debajo del stock mínimo</p>
        </div>
        <div class="table-wrap">
          <table class="data">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Producto</th>
                <th>Stock</th>
                <th>Mínimo</th>
                <th>PVP</th>
              </tr>
            </thead>
            <tbody>
              @for (p of lowStock(); track p.id) {
                <tr>
                  <td class="mono">{{ p.sku }}</td>
                  <td>
                    <strong>{{ p.name }}</strong>
                  </td>
                  <td>
                    <span [class]="p.stock <= p.minStock ? 'text-warn' : ''">{{ p.stock }}</span>
                  </td>
                  <td>{{ p.minStock }}</td>
                  <td>{{ p.salePrice | bs }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5">
                    <div class="empty">
                      <div class="icon">📦</div>
                      No hay productos bajo stock mínimo
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="pagination">
          <span>{{ lowStockTotal() }} productos con stock crítico</span>
        </div>
      </div>
    </div>
  `,
  styles: `
    .range {
      display: flex;
      gap: 12px;
      align-items: flex-end;
      flex-wrap: wrap;
    }
    .field.inline {
      margin-bottom: 0;
      min-width: 190px;
    }
    .text-warn {
      color: var(--warning);
      font-weight: 650;
    }
  `,
})
export class ReportsComponent {
  private api = inject(ApiService);

  from = '';
  to = '';

  points = signal<SalesPoint[]>([]);
  lowStock = signal<LowStockItem[]>([]);
  lowStockTotal = signal(0);
  dash = signal<DashboardSummary | null>(null);

  chart = {
    chart: {
      type: 'area',
      height: 280,
      toolbar: { show: false },
      zoom: { enabled: false },
    } as ApexChart,
    series: signal<{ name: string; data: number[] }[]>([]),
    xaxis: { categories: [] as string[] },
    colors: ['#2563eb'],
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (v: number) => `Bs ${v.toFixed(2)}` } },
  };

  periodTotal = computed(() => this.points().reduce((sum, p) => sum + (Number(p.total) || 0), 0));
  periodDocs = computed(() => this.points().reduce((sum, p) => sum + (p.count || 0), 0));

  constructor() {
    const to = new Date();
    const from = new Date(to.getTime() - 13 * 86400000);
    this.to = this.fmt(to);
    this.from = this.fmt(from);
    this.api.get<DashboardSummary>('/reports/dashboard').subscribe((d) => this.dash.set(d));
    this.generate();
  }

  private fmt(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  generate(): void {
    this.api
      .get<SalesPoint[]>('/reports/sales-by-day', { from: this.from, to: this.to })
      .subscribe((res) => {
        this.points.set(res);
        this.chart.series.set([
          { name: 'Ventas (Bs)', data: res.map((p) => Number(p.total) || 0) },
        ]);
        this.chart.xaxis.categories = res.map((p) => p.day.slice(5));
      });
    this.api
      .get<LowStockResponse>('/reports/low-stock', { page: 1, pageSize: 50 })
      .subscribe((res) => {
        this.lowStock.set(res.items);
        this.lowStockTotal.set(res.total);
      });
  }
}
