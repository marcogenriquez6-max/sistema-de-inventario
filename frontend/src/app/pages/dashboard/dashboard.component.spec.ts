import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { ApiService } from '../../core/services/api.service';

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let component: DashboardComponent;
  let mockApi: Partial<ApiService>;

  beforeEach(async () => {
    mockApi = {
      get: vi.fn((path: string) => {
        if (path === '/reports/dashboard') {
          return of({
            todaySales: { count: 2, total: 450.5 },
            monthSales: { count: 10, total: 5000 },
            lowStockCount: 1,
            totalProducts: 42,
            totalStockValue: 15000,
            lowStockProducts: [],
            recentSales: [],
          });
        }

        if (path === '/health/modules') {
          return of({
            enabledCount: 5,
            totalCount: 10,
            modules: [
              { name: 'Catálogo', slug: 'catalog', enabled: true, description: 'Productos', category: 'operational' },
            ],
          });
        }

        if (path === '/reports/sales-by-day') {
          return of([{ day: '2026-08-01', total: 1200, count: 4 }]);
        }

        return of(null as any);
      }),
    };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [{ provide: ApiService, useValue: mockApi }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create and load dashboard data', () => {
    fixture.detectChanges();

    expect(component.dash()).toEqual(
      expect.objectContaining({
        todaySales: expect.objectContaining({ total: 450.5 }),
      }),
    );
    expect(component.moduleState()?.enabledCount).toBe(5);
    expect(component.chart.series()[0].data).toEqual([1200]);
    expect((mockApi.get as any).mock.calls.length).toBe(3);
  });
});
