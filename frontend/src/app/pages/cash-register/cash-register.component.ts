import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { CashMovement, CashRegister, Paginated } from '../../core/models';

interface MovementForm {
  type: string;
  amount: number | null;
  description: string;
}

const TYPE_LABEL: Record<string, string> = {
  INCOME: 'Ingreso',
  EXPENSE: 'Egreso',
  DEPOSIT: 'Depósito',
  WITHDRAWAL: 'Retiro',
};

const TYPE_CHIP: Record<string, string> = {
  INCOME: 'chip-success',
  EXPENSE: 'chip-danger',
  DEPOSIT: 'chip-info',
  WITHDRAWAL: 'chip-warning',
};

@Component({
  selector: 'app-cash-register',
  imports: [FormsModule, CommonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Caja registradora</h1>
          <p class="muted small">Control de ingresos y egresos del día</p>
        </div>
        @if (register()) {
          <button class="btn btn-danger" (click)="close()">Cerrar caja</button>
        }
      </div>

      @if (!register()) {
        <div class="card card-pad" style="max-width: 460px">
          <h3>Abrir caja</h3>
          <div class="field">
            <label>Monto inicial (Bs)</label>
            <input
              class="input"
              type="number"
              step="0.01"
              min="0"
              [(ngModel)]="initialBalance"
              name="initialBalance"
            />
          </div>
          <button class="btn btn-primary" (click)="open()">Abrir caja</button>
        </div>
      } @else {
        <div class="stat-grid">
          <div class="stat">
            <div class="label">Saldo inicial</div>
            <div class="value">Bs {{ initial() | number: '1.2-2' }}</div>
            <div class="sub">Apertura de caja</div>
          </div>
          <div class="stat">
            <div class="label">Total esperado</div>
            <div class="value">Bs {{ expected() | number: '1.2-2' }}</div>
            <div class="sub">Saldo inicial + movimientos</div>
          </div>
          <div class="stat">
            <div class="label">Movimientos</div>
            <div class="value">{{ meta().totalItems }}</div>
            <div class="sub">Registrados en el día</div>
          </div>
        </div>

        <div class="card card-pad">
          <h3>Registrar movimiento</h3>
          <form class="form-grid" (ngSubmit)="addMovement()" novalidate>
            <div class="field">
              <label>Tipo</label>
              <select class="select" [(ngModel)]="mForm.type" name="mType">
                <option value="INCOME">Ingreso</option>
                <option value="EXPENSE">Egreso</option>
                <option value="DEPOSIT">Depósito</option>
                <option value="WITHDRAWAL">Retiro</option>
              </select>
            </div>
            <div class="field">
              <label>Monto (Bs) *</label>
              <input
                class="input"
                type="number"
                step="0.01"
                min="0"
                [(ngModel)]="mForm.amount"
                name="mAmount"
                required
              />
            </div>
            <div class="field">
              <label>Descripción</label>
              <input
                class="input"
                [(ngModel)]="mForm.description"
                name="mDescription"
                placeholder="Opcional"
              />
            </div>
            <div class="field">
              <label>&nbsp;</label>
              <button class="btn btn-primary" type="submit">Registrar</button>
            </div>
          </form>
        </div>

        <div class="card">
          <div class="card-head">
            <h3>Movimientos del día</h3>
          </div>
          <div class="table-wrap">
            <table class="data">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Monto</th>
                  <th>Descripción</th>
                  <th>Fecha</th>
                  <th>Usuario</th>
                </tr>
              </thead>
              <tbody>
                @for (m of movements(); track m.id) {
                  <tr>
                    <td>
                      <span class="chip {{ chipClass(m.movementType) }}">{{
                        typeLabel(m.movementType)
                      }}</span>
                    </td>
                    <td>
                      <strong>Bs {{ num(m.amount) | number: '1.2-2' }}</strong>
                    </td>
                    <td>{{ m.description || '—' }}</td>
                    <td>{{ m.createdAt | date: 'dd/MM/yy HH:mm' }}</td>
                    <td class="muted">Usr {{ m.userId }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5">
                      <div class="empty">
                        <div class="icon">💵</div>
                        Sin movimientos registrados
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <div class="pagination">
            <span>{{ meta().totalItems }} movimientos</span>
            <div class="pages">
              <button (click)="loadMovements(meta().page - 1)" [disabled]="meta().page <= 1">
                ‹
              </button>
              <span class="muted">Página {{ meta().page }} de {{ meta().totalPages || 1 }}</span>
              <button
                (click)="loadMovements(meta().page + 1)"
                [disabled]="meta().page >= meta().totalPages"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .card-head {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
    }
  `,
})
export class CashRegisterComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  register = signal<CashRegister | null>(null);
  movements = signal<CashMovement[]>([]);
  meta = signal({ page: 1, pageSize: 10, totalItems: 0, totalPages: 0 });

  initialBalance = 0;
  mForm: MovementForm = { type: 'INCOME', amount: null, description: '' };

  readonly initial = computed(() => Number(this.register()?.initialBalance ?? 0));
  readonly expected = computed(() => Number(this.register()?.expected ?? 0));

  constructor() {
    this.load();
  }

  load(): void {
    this.api.get<CashRegister | null>('/cash-registers/mine').subscribe({
      next: (reg) => {
        this.register.set(reg);
        if (reg) {
          this.loadMovements(1);
        } else {
          this.movements.set([]);
          this.meta.set({ page: 1, pageSize: 10, totalItems: 0, totalPages: 0 });
        }
      },
    });
  }

  loadMovements(page: number): void {
    const reg = this.register();
    if (!reg) return;
    this.api
      .get<Paginated<CashMovement> | CashMovement[]>(`/cash-registers/${reg.id}/movements`, {
        page,
        pageSize: 10,
      })
      .subscribe({
        next: (res) => {
          if (Array.isArray(res)) {
            this.movements.set(res);
            this.meta.set({ page: 1, pageSize: 10, totalItems: res.length, totalPages: 1 });
          } else {
            this.movements.set(res.items);
            this.meta.set(res.meta);
          }
        },
      });
  }

  async open(): Promise<void> {
    if (this.initialBalance <= 0) {
      this.toast.error('Ingrese un monto inicial válido');
      return;
    }
    try {
      const reg = await this.api
        .post<CashRegister>('/cash-registers', { initialBalance: this.initialBalance })
        .toPromise();
      if (!reg) return;
      this.toast.success('Caja abierta');
      this.register.set(reg);
      this.initialBalance = 0;
      this.loadMovements(1);
    } catch {
      /* toast del interceptor */
    }
  }

  async addMovement(): Promise<void> {
    const reg = this.register();
    const amount = this.mForm.amount;
    if (!reg) return;
    if (amount == null || amount <= 0) {
      this.toast.error('Ingrese un monto válido');
      return;
    }
    try {
      await this.api
        .post(`/cash-registers/${reg.id}/movements`, {
          movementType: this.mForm.type,
          amount,
          description: this.mForm.description || undefined,
        })
        .toPromise();
      this.toast.success('Movimiento registrado');
      this.mForm = { type: 'INCOME', amount: null, description: '' };
      this.load();
    } catch {
      /* toast del interceptor */
    }
  }

  async close(): Promise<void> {
    const reg = this.register();
    if (!reg) return;
    const input = window.prompt('Ingrese el monto contado en caja (Bs):');
    if (input === null) return;
    const countedAmount = Number(input);
    if (Number.isNaN(countedAmount)) {
      this.toast.error('Monto no válido');
      return;
    }
    try {
      const closed = await this.api
        .post<CashRegister>(`/cash-registers/${reg.id}/close`, { countedAmount })
        .toPromise();
      if (!closed) return;
      const diff = Number(closed.difference ?? 0);
      const msg =
        diff === 0
          ? 'Caja cerrada · Sin diferencia'
          : `Caja cerrada · Diferencia de Bs ${diff.toFixed(2)} (${diff > 0 ? 'sobrante' : 'faltante'})`;
      this.toast.success(msg);
      this.register.set(null);
      this.movements.set([]);
      this.meta.set({ page: 1, pageSize: 10, totalItems: 0, totalPages: 0 });
    } catch {
      /* toast del interceptor */
    }
  }

  typeLabel(type: string): string {
    return TYPE_LABEL[type] ?? type;
  }

  num(v: unknown): number {
    return Number(v) || 0;
  }

  chipClass(type: string): string {
    return TYPE_CHIP[type] ?? 'chip-neutral';
  }
}
