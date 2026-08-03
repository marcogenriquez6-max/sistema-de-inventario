import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { Account, JournalEntry, TrialBalanceRow } from '../../core/models';

interface EntryLine {
  accountId: number | null;
  debit: number | null;
  credit: number | null;
}

interface EntryPage {
  items: JournalEntry[];
  total: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

type Tab = 'balance' | 'entries' | 'entry-new' | 'account-new';

@Component({
  selector: 'app-accounting',
  imports: [FormsModule, CommonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Contabilidad</h1>
          <p class="muted small">Plan de cuentas, asientos y balance de comprobación</p>
        </div>
      </div>

      <div class="tabs">
        <button [class.active]="tab() === 'balance'" (click)="tab.set('balance')">
          Balance de comprobación
        </button>
        <button [class.active]="tab() === 'entries'" (click)="tab.set('entries')">Asientos</button>
        <button [class.active]="tab() === 'entry-new'" (click)="tab.set('entry-new')">
          Nuevo asiento
        </button>
        <button [class.active]="tab() === 'account-new'" (click)="tab.set('account-new')">
          Nueva cuenta
        </button>
      </div>

      @switch (tab()) {
        @case ('balance') {
          <div class="card">
            <div class="card-head"><h3>Balance de comprobación</h3></div>
            <div class="table-wrap">
              <table class="data">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Cuenta</th>
                    <th class="num">Debe</th>
                    <th class="num">Haber</th>
                  </tr>
                </thead>
                <tbody>
                  @for (r of balance(); track r.code) {
                    <tr>
                      <td class="mono">{{ r.code }}</td>
                      <td>{{ r.name }}</td>
                      <td class="num">Bs {{ r.debit | number: '1.2-2' }}</td>
                      <td class="num">Bs {{ r.credit | number: '1.2-2' }}</td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="4">
                        <div class="empty">
                          <div class="icon">📊</div>
                          Sin cuentas registradas
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
                @if (balance().length) {
                  <tfoot>
                    <tr>
                      <td colspan="2">Totales</td>
                      <td class="num">Bs {{ totalDebits() | number: '1.2-2' }}</td>
                      <td class="num">Bs {{ totalCredits() | number: '1.2-2' }}</td>
                    </tr>
                  </tfoot>
                }
              </table>
            </div>
          </div>
        }

        @case ('entries') {
          <div class="card">
            <div class="card-head"><h3>Asientos contables</h3></div>
            <div class="entries">
              @for (e of entries(); track e.id) {
                <div class="entry">
                  <div class="entry-head">
                    <div>
                      <strong class="mono">{{ e.entryNumber }}</strong>
                      <span class="muted"> · {{ e.date }}</span>
                      @if (e.description) {
                        <div class="small muted">{{ e.description }}</div>
                      }
                    </div>
                    <div class="entry-totals">
                      <span class="small"
                        >Debe <strong>Bs {{ entryDebits(e) | number: '1.2-2' }}</strong></span
                      >
                      <span class="small"
                        >Haber <strong>Bs {{ entryCredits(e) | number: '1.2-2' }}</strong></span
                      >
                      <button class="btn btn-ghost btn-sm" (click)="toggleEntry(e.id)">
                        {{ isExpanded(e.id) ? 'Ocultar' : 'Detalle' }}
                      </button>
                    </div>
                  </div>
                  @if (isExpanded(e.id)) {
                    <div class="entry-lines">
                      <table class="data">
                        <thead>
                          <tr>
                            <th>Cuenta</th>
                            <th class="num">Debe</th>
                            <th class="num">Haber</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (l of entryDetail(e.id)?.lines ?? []; track l.id) {
                            <tr>
                              <td>{{ l.account?.name ?? 'Cuenta #' + l.accountId }}</td>
                              <td class="num">Bs {{ num(l.debit) | number: '1.2-2' }}</td>
                              <td class="num">Bs {{ num(l.credit) | number: '1.2-2' }}</td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  }
                </div>
              } @empty {
                <div class="empty">
                  <div class="icon">📒</div>
                  Sin asientos registrados
                </div>
              }
            </div>
            <div class="pagination">
              <span>{{ entryMeta().totalItems }} asientos</span>
              <div class="pages">
                <button
                  (click)="loadEntries(entryMeta().page - 1)"
                  [disabled]="entryMeta().page <= 1"
                >
                  ‹
                </button>
                <span class="muted"
                  >Página {{ entryMeta().page }} de {{ entryMeta().totalPages || 1 }}</span
                >
                <button
                  (click)="loadEntries(entryMeta().page + 1)"
                  [disabled]="entryMeta().page >= entryMeta().totalPages"
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        }

        @case ('entry-new') {
          <div class="card card-pad">
            <h3>Nuevo asiento contable</h3>
            <div class="form-grid">
              <div class="field">
                <label>Fecha *</label>
                <input class="input" type="date" [(ngModel)]="entry.date" name="entryDate" />
              </div>
              <div class="field">
                <label>Descripción</label>
                <input
                  class="input"
                  [(ngModel)]="entry.description"
                  name="entryDescription"
                  placeholder="Concepto del asiento"
                />
              </div>
            </div>

            <div class="lines">
              @for (line of lines(); track $index; let i = $index) {
                <div class="entry-line">
                  <select
                    class="select"
                    [ngModel]="line.accountId"
                    (ngModelChange)="setLineAccount(i, $event)"
                    name="acct-{{ i }}"
                  >
                    <option [ngValue]="null" disabled>Seleccionar cuenta</option>
                    @for (a of accounts(); track a.id) {
                      <option [ngValue]="a.id">{{ a.code }} — {{ a.name }}</option>
                    }
                  </select>
                  <input
                    class="input"
                    type="number"
                    step="0.01"
                    min="0"
                    [ngModel]="line.debit"
                    (ngModelChange)="setLineDebit(i, $event)"
                    name="debit-{{ i }}"
                    placeholder="Debe"
                  />
                  <input
                    class="input"
                    type="number"
                    step="0.01"
                    min="0"
                    [ngModel]="line.credit"
                    (ngModelChange)="setLineCredit(i, $event)"
                    name="credit-{{ i }}"
                    placeholder="Haber"
                  />
                  <button type="button" class="btn btn-ghost" (click)="removeLine(i)">✕</button>
                </div>
              }
              <div>
                <button type="button" class="btn btn-ghost" (click)="addLine()">+ Línea</button>
              </div>
            </div>

            <div class="balance-row">
              <span
                >Débitos: <strong>Bs {{ sumDebits() | number: '1.2-2' }}</strong></span
              >
              <span
                >Créditos: <strong>Bs {{ sumCredits() | number: '1.2-2' }}</strong></span
              >
              @if (!balanced()) {
                <span class="warn">Debe y Haber no cuadran</span>
              } @else {
                <span class="ok">El asiento cuadra</span>
              }
            </div>

            <div class="actions">
              <button
                class="btn btn-primary"
                (click)="saveEntry()"
                [disabled]="!balanced() || saving()"
              >
                {{ saving() ? 'Guardando…' : 'Guardar asiento' }}
              </button>
            </div>
          </div>
        }

        @case ('account-new') {
          <div class="card card-pad" style="max-width: 520px">
            <h3>Nueva cuenta contable</h3>
            <div class="field">
              <label>Código *</label>
              <input
                class="input"
                [(ngModel)]="accForm.code"
                name="accCode"
                placeholder="Ej. 1010"
              />
            </div>
            <div class="field">
              <label>Nombre *</label>
              <input
                class="input"
                [(ngModel)]="accForm.name"
                name="accName"
                placeholder="Ej. Caja"
              />
            </div>
            <div class="field">
              <label>Tipo *</label>
              <select class="select" [(ngModel)]="accForm.type" name="accType">
                <option value="ASSET">Activo</option>
                <option value="LIABILITY">Pasivo</option>
                <option value="EQUITY">Patrimonio</option>
                <option value="REVENUE">Ingresos</option>
                <option value="EXPENSE">Gastos</option>
              </select>
            </div>
            <div class="actions">
              <button class="btn btn-primary" (click)="saveAccount()" [disabled]="saving()">
                {{ saving() ? 'Guardando…' : 'Guardar cuenta' }}
              </button>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: `
    .tabs {
      display: flex;
      gap: 4px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 16px;
      overflow-x: auto;
    }
    .tabs button {
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      padding: 9px 14px;
      font-size: 13.5px;
      font-weight: 550;
      color: var(--text-secondary);
      cursor: pointer;
      white-space: nowrap;
    }
    .tabs button.active {
      color: var(--primary);
      border-bottom-color: var(--primary);
    }
    .card-head {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
    }
    .entry {
      border-bottom: 1px solid var(--border);
    }
    .entry:last-child {
      border-bottom: none;
    }
    .entry-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      flex-wrap: wrap;
    }
    .entry-totals {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .btn-sm {
      padding: 4px 10px;
      font-size: 12.5px;
    }
    .entry-lines {
      padding: 0 16px 12px;
    }
    .num {
      text-align: right;
    }
    .lines {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 12px;
    }
    .entry-line {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr auto;
      gap: 8px;
    }
    .balance-row {
      display: flex;
      gap: 18px;
      align-items: center;
      flex-wrap: wrap;
      padding: 10px 12px;
      background: var(--surface-2);
      border-radius: var(--radius-sm);
      margin-bottom: 12px;
      font-size: 13.5px;
    }
    .warn {
      color: var(--danger);
      font-weight: 600;
    }
    .ok {
      color: var(--success);
      font-weight: 600;
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
    @media (max-width: 720px) {
      .entry-line {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class AccountingComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  tab = signal<Tab>('balance');
  accounts = signal<Account[]>([]);
  balance = signal<TrialBalanceRow[]>([]);
  entries = signal<JournalEntry[]>([]);
  entryMeta = signal({ page: 1, pageSize: 10, totalItems: 0, totalPages: 0 });
  expanded = signal<number[]>([]);
  details = signal<Record<number, JournalEntry>>({});
  saving = signal(false);

  entry = { date: new Date().toISOString().slice(0, 10), description: '' };
  lines = signal<EntryLine[]>([{ accountId: null, debit: null, credit: null }]);
  accForm = { code: '', name: '', type: 'ASSET' };

  readonly sumDebits = computed(() => this.lines().reduce((a, l) => a + (l.debit ?? 0), 0));
  readonly sumCredits = computed(() => this.lines().reduce((a, l) => a + (l.credit ?? 0), 0));
  readonly balanced = computed(
    () =>
      this.lines().length > 0 &&
      this.lines().every((l) => l.accountId != null) &&
      Math.abs(this.sumDebits() - this.sumCredits()) < 0.01,
  );
  readonly totalDebits = computed(() => this.balance().reduce((a, r) => a + Number(r.debit), 0));
  readonly totalCredits = computed(() => this.balance().reduce((a, r) => a + Number(r.credit), 0));

  constructor() {
    this.loadAccounts();
    this.loadBalance();
    this.loadEntries(1);
  }

  loadAccounts(): void {
    this.api.get<Account[]>('/accounting/accounts').subscribe({
      next: (list) => this.accounts.set(list),
    });
  }

  loadBalance(): void {
    this.api.get<TrialBalanceRow[]>('/accounting/trial-balance').subscribe({
      next: (rows) => this.balance.set(rows),
    });
  }

  loadEntries(page: number): void {
    this.api.get<EntryPage>('/accounting/entries', { page, pageSize: 10 }).subscribe({
      next: (res) => {
        this.entries.set(res.items);
        this.entryMeta.set({
          page,
          pageSize: 10,
          totalItems: res.total,
          totalPages: Math.max(1, Math.ceil(res.total / 10)),
        });
      },
    });
  }

  entryDebits(e: JournalEntry): number {
    return e.lines.reduce((a, l) => a + Number(l.debit), 0);
  }

  entryCredits(e: JournalEntry): number {
    return e.lines.reduce((a, l) => a + Number(l.credit), 0);
  }

  num(v: unknown): number {
    return Number(v) || 0;
  }

  toggleEntry(id: number): void {
    if (this.isExpanded(id)) {
      this.expanded.set(this.expanded().filter((x) => x !== id));
      return;
    }
    if (!this.details()[id]) {
      this.api.get<JournalEntry>(`/accounting/entries/${id}`).subscribe({
        next: (e) => this.details.update((d) => ({ ...d, [id]: e })),
      });
    }
    this.expanded.set([...this.expanded(), id]);
  }

  isExpanded(id: number): boolean {
    return this.expanded().includes(id);
  }

  entryDetail(id: number): JournalEntry | undefined {
    return this.details()[id];
  }

  addLine(): void {
    this.lines.set([...this.lines(), { accountId: null, debit: null, credit: null }]);
  }

  removeLine(i: number): void {
    this.lines.set(this.lines().filter((_, idx) => idx !== i));
  }

  setLineAccount(i: number, accountId: number | null): void {
    this.lines.update((ls) => ls.map((l, idx) => (idx === i ? { ...l, accountId } : l)));
  }

  setLineDebit(i: number, debit: number | null): void {
    this.lines.update((ls) => ls.map((l, idx) => (idx === i ? { ...l, debit } : l)));
  }

  setLineCredit(i: number, credit: number | null): void {
    this.lines.update((ls) => ls.map((l, idx) => (idx === i ? { ...l, credit } : l)));
  }

  async saveEntry(): Promise<void> {
    if (!this.balanced() || !this.entry.date) {
      this.toast.error('Complete la fecha y verifique que el asiento cuadre');
      return;
    }
    this.saving.set(true);
    try {
      await this.api
        .post('/accounting/entries', {
          date: this.entry.date,
          description: this.entry.description || undefined,
          lines: this.lines().map((l) => ({
            accountId: l.accountId,
            debit: l.debit ?? 0,
            credit: l.credit ?? 0,
          })),
        })
        .toPromise();
      this.toast.success('Asiento registrado');
      this.entry = { date: new Date().toISOString().slice(0, 10), description: '' };
      this.lines.set([{ accountId: null, debit: null, credit: null }]);
      this.loadEntries(1);
      this.loadBalance();
      this.tab.set('entries');
    } catch {
      /* toast del interceptor */
    } finally {
      this.saving.set(false);
    }
  }

  async saveAccount(): Promise<void> {
    if (!this.accForm.code || !this.accForm.name) {
      this.toast.error('Complete código y nombre');
      return;
    }
    this.saving.set(true);
    try {
      await this.api
        .post('/accounting/accounts', {
          code: this.accForm.code,
          name: this.accForm.name,
          type: this.accForm.type,
        })
        .toPromise();
      this.toast.success('Cuenta creada');
      this.accForm = { code: '', name: '', type: 'ASSET' };
      this.loadAccounts();
      this.loadBalance();
    } catch {
      /* toast del interceptor */
    } finally {
      this.saving.set(false);
    }
  }
}
