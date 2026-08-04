import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { BankAccount, BankMovement, Paginated } from '../../core/models';

interface OperationForm {
  type: string;
  amount: number | null;
  description: string;
}

interface TransferForm {
  toAccountId: number | null;
  amount: number | null;
  description: string;
}

interface AccountForm {
  name: string;
  bank: string;
  accountType: string;
  accountNumber: string;
  currency: string;
}

@Component({
  selector: 'app-banking',
  imports: [FormsModule, CommonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Bancos / Tesorería</h1>
          <p class="muted small">Cuentas bancarias, depósitos, retiros y transferencias</p>
        </div>
        <button class="btn btn-primary" (click)="showModal.set(true)">+ Nueva cuenta</button>
      </div>

      <div class="acc-grid">
        @for (a of accounts(); track a.id) {
          <div class="acc-card" [class.selected]="a.id === selectedId()" (click)="selectAccount(a)">
            <div class="acc-top">
              <strong>{{ a.name }}</strong>
              <span class="chip chip-info">{{ accountTypeLabel(a.accountType) }}</span>
            </div>
            <div class="muted small">{{ a.bank }}</div>
            <div class="mono small muted">{{ a.accountNumber || '—' }}</div>
            <div class="balance">Bs {{ num(a.balance) | number: '1.2-2' }}</div>
          </div>
        } @empty {
          <div class="empty">
            <div class="icon">🏦</div>
            Sin cuentas bancarias. Cree la primera.
          </div>
        }
      </div>

      @if (selected(); as sel) {
        <div class="ops-grid">
          <div class="card card-pad">
            <h3>Depósito / Retiro</h3>
            <div class="field">
              <label>Tipo</label>
              <select class="select" [(ngModel)]="opForm.type" name="opType">
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
                [(ngModel)]="opForm.amount"
                name="opAmount"
              />
            </div>
            <div class="field">
              <label>Descripción</label>
              <input
                class="input"
                [(ngModel)]="opForm.description"
                name="opDescription"
                placeholder="Opcional"
              />
            </div>
            <button class="btn btn-primary" (click)="addOperation(sel.id)">Registrar</button>
          </div>

          <div class="card card-pad">
            <h3>Transferencia</h3>
            <div class="field">
              <label>Cuenta destino *</label>
              <select class="select" [(ngModel)]="transferForm.toAccountId" name="toAccount">
                <option [ngValue]="null" disabled>Seleccionar cuenta</option>
                @for (a of accounts(); track a.id) {
                  @if (a.id !== sel.id) {
                    <option [ngValue]="a.id">{{ a.name }} · {{ a.bank }}</option>
                  }
                }
              </select>
            </div>
            <div class="field">
              <label>Monto (Bs) *</label>
              <input
                class="input"
                type="number"
                step="0.01"
                min="0"
                [(ngModel)]="transferForm.amount"
                name="tfAmount"
              />
            </div>
            <div class="field">
              <label>Descripción</label>
              <input
                class="input"
                [(ngModel)]="transferForm.description"
                name="tfDescription"
                placeholder="Opcional"
              />
            </div>
            <button class="btn btn-primary" (click)="transfer(sel.id)">Transferir</button>
          </div>
        </div>

        <div class="card">
          <div class="card-head">
            <h3>Movimientos — {{ sel.name }}</h3>
          </div>
          <div class="table-wrap">
            <table class="data">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Monto</th>
                  <th>Descripción</th>
                  <th>Fecha</th>
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
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="4">
                      <div class="empty">
                        <div class="icon">💳</div>
                        Sin movimientos
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <div class="pagination">
            <span>{{ movMeta().totalItems }} movimientos</span>
            <div class="pages">
              <button (click)="loadMovements(movMeta().page - 1)" [disabled]="movMeta().page <= 1">
                ‹
              </button>
              <span class="muted"
                >Página {{ movMeta().page }} de {{ movMeta().totalPages || 1 }}</span
              >
              <button
                (click)="loadMovements(movMeta().page + 1)"
                [disabled]="movMeta().page >= movMeta().totalPages"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      }
    </div>

    @if (showModal()) {
      <div class="modal-overlay" (click)="showModal.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>Nueva cuenta bancaria</h3>
          <div class="field">
            <label>Nombre *</label>
            <input
              class="input"
              [(ngModel)]="accountForm.name"
              name="accName"
              placeholder="Ej. Caja BCP"
            />
          </div>
          <div class="field">
            <label>Banco *</label>
            <input
              class="input"
              [(ngModel)]="accountForm.bank"
              name="accBank"
              placeholder="Ej. BCP"
            />
          </div>
          <div class="field">
            <label>Tipo de cuenta *</label>
            <select class="select" [(ngModel)]="accountForm.accountType" name="accType">
              <option value="SAVINGS">Ahorro</option>
              <option value="CHECKING">Corriente</option>
              <option value="FIXED">Plazo fijo</option>
            </select>
          </div>
          <div class="field">
            <label>Número de cuenta</label>
            <input
              class="input"
              [(ngModel)]="accountForm.accountNumber"
              name="accNumber"
              placeholder="Opcional"
            />
          </div>
          <div class="field">
            <label>Moneda</label>
            <input class="input" value="BOB" disabled />
          </div>
          <div class="actions">
            <button class="btn btn-ghost" (click)="showModal.set(false)">Cancelar</button>
            <button class="btn btn-primary" (click)="createAccount()" [disabled]="saving()">
              {{ saving() ? 'Guardando…' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .acc-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 14px;
    }
    .acc-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 14px 16px;
      cursor: pointer;
      box-shadow: var(--shadow);
      transition:
        border-color 0.15s,
        box-shadow 0.15s;
    }
    .acc-card:hover {
      border-color: var(--primary);
    }
    .acc-card.selected {
      border-color: var(--primary);
      box-shadow: 0 0 0 2px var(--primary-soft);
    }
    .acc-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }
    .balance {
      font-size: 20px;
      font-weight: 700;
      margin-top: 8px;
    }
    .ops-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin: 16px 0;
    }
    @media (max-width: 860px) {
      .ops-grid {
        grid-template-columns: 1fr;
      }
    }
    .card-head {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
    }
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
    }
    .modal {
      background: var(--surface);
      border-radius: var(--radius);
      padding: 20px;
      width: 420px;
      max-width: calc(100vw - 32px);
      box-shadow: var(--shadow-md);
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 6px;
    }
  `,
})
export class BankingComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  accounts = signal<BankAccount[]>([]);
  movements = signal<BankMovement[]>([]);
  movMeta = signal({ page: 1, pageSize: 10, totalItems: 0, totalPages: 0 });
  selectedId = signal<number | null>(null);
  showModal = signal(false);
  saving = signal(false);

  opForm: OperationForm = { type: 'DEPOSIT', amount: null, description: '' };
  transferForm: TransferForm = { toAccountId: null, amount: null, description: '' };
  accountForm: AccountForm = {
    name: '',
    bank: '',
    accountType: 'SAVINGS',
    accountNumber: '',
    currency: 'BOB',
  };

  readonly selected = computed(
    () => this.accounts().find((a) => a.id === this.selectedId()) ?? null,
  );

  constructor() {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.api.get<BankAccount[]>('/banking/accounts').subscribe({
      next: (list) => {
        this.accounts.set(list);
        const sel = this.selectedId();
        if (sel != null && !list.some((a) => a.id === sel)) {
          this.selectedId.set(null);
          this.movements.set([]);
        } else if (sel == null && list.length > 0) {
          this.selectAccount(list[0]);
        }
      },
    });
  }

  selectAccount(a: BankAccount): void {
    this.selectedId.set(a.id);
    this.loadMovements(1);
  }

  loadMovements(page: number): void {
    const id = this.selectedId();
    if (id == null) return;
    this.api
      .get<Paginated<BankMovement> | BankMovement[]>(`/banking/accounts/${id}/movements`, {
        page,
        pageSize: 10,
      })
      .subscribe({
        next: (res) => {
          if (Array.isArray(res)) {
            this.movements.set(res);
            this.movMeta.set({ page: 1, pageSize: 10, totalItems: res.length, totalPages: 1 });
          } else {
            this.movements.set(res.items);
            this.movMeta.set(res.meta);
          }
        },
      });
  }

  async addOperation(accountId: number): Promise<void> {
    const amount = this.opForm.amount;
    if (amount == null || amount <= 0) {
      this.toast.error('Ingrese un monto válido');
      return;
    }
    this.saving.set(true);
    try {
      await this.api
        .post(`/banking/accounts/${accountId}/movements`, {
          movementType: this.opForm.type,
          amount,
          description: this.opForm.description || undefined,
        })
        .toPromise();
      this.toast.success('Movimiento registrado');
      this.opForm = { type: 'DEPOSIT', amount: null, description: '' };
      this.loadAccounts();
      this.loadMovements(1);
    } catch {
      /* toast del interceptor */
    } finally {
      this.saving.set(false);
    }
  }

  async transfer(accountId: number): Promise<void> {
    const t = this.transferForm;
    if (t.toAccountId == null || t.amount == null || t.amount <= 0) {
      this.toast.error('Seleccione cuenta destino e ingrese un monto válido');
      return;
    }
    this.saving.set(true);
    try {
      await this.api
        .post(`/banking/accounts/${accountId}/transfer`, {
          toAccountId: t.toAccountId,
          amount: t.amount,
          description: t.description || undefined,
        })
        .toPromise();
      this.toast.success('Transferencia realizada');
      this.transferForm = { toAccountId: null, amount: null, description: '' };
      this.loadAccounts();
      this.loadMovements(1);
    } catch {
      /* toast del interceptor */
    } finally {
      this.saving.set(false);
    }
  }

  async createAccount(): Promise<void> {
    const f = this.accountForm;
    if (!f.name || !f.bank) {
      this.toast.error('Complete nombre y banco');
      return;
    }
    this.saving.set(true);
    try {
      await this.api
        .post('/banking/accounts', {
          name: f.name,
          bank: f.bank,
          accountType: f.accountType,
          accountNumber: f.accountNumber || undefined,
          currency: 'BOB',
        })
        .toPromise();
      this.toast.success('Cuenta creada');
      this.accountForm = {
        name: '',
        bank: '',
        accountType: 'SAVINGS',
        accountNumber: '',
        currency: 'BOB',
      };
      this.showModal.set(false);
      this.loadAccounts();
    } catch {
      /* toast del interceptor */
    } finally {
      this.saving.set(false);
    }
  }

  accountTypeLabel(type: string): string {
    return { SAVINGS: 'Ahorro', CHECKING: 'Corriente', FIXED: 'Plazo fijo' }[type] ?? type;
  }

  num(v: unknown): number {
    return Number(v) || 0;
  }

  typeLabel(type: string): string {
    return (
      {
        DEPOSIT: 'Depósito',
        WITHDRAWAL: 'Retiro',
        TRANSFER_IN: 'Transferencia entrante',
        TRANSFER_OUT: 'Transferencia saliente',
      }[type] ?? type
    );
  }

  chipClass(type: string): string {
    return (
      {
        DEPOSIT: 'chip-success',
        WITHDRAWAL: 'chip-danger',
        TRANSFER_IN: 'chip-info',
        TRANSFER_OUT: 'chip-warning',
      }[type] ?? 'chip-neutral'
    );
  }
}
