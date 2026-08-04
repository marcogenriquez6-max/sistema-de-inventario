import { Component, computed, inject, signal } from '@angular/core';
import { TasksService, TaskItem } from '../../core/services/tasks.service';

@Component({
  selector: 'app-calendar',
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Calendario</h1>
          <p class="muted small">Tareas con fecha límite organizadas por día</p>
        </div>
        <div class="nav">
          <button class="btn btn-ghost" (click)="shift(-1)">←</button>
          <span class="month">{{ monthLabel() }}</span>
          <button class="btn btn-ghost" (click)="shift(1)">→</button>
          <button class="btn btn-ghost" (click)="today()">Hoy</button>
        </div>
      </div>

      <div class="grid" role="grid" aria-label="Calendario mensual">
        @for (d of weekdays; track d) {
          <div class="wd">{{ d }}</div>
        }
        @for (cell of cells(); track cell.key) {
          <div
            class="day"
            [class.other]="cell.other"
            [class.today]="cell.isToday"
            role="gridcell"
          >
            <div class="day-num">{{ cell.day }}</div>
            <div class="tasks">
              @for (t of tasksOn(cell.date); track t.id) {
                <button
                  class="task"
                  [class]="t.priority"
                  [class.overdue]="isOverdue(t)"
                  (click)="select(t)"
                  [attr.title]="t.title"
                >
                  {{ t.title }}
                </button>
              }
            </div>
          </div>
        }
      </div>

      @if (selected()) {
        <div class="detail card card-pad">
          <h3>{{ selected()!.title }}</h3>
          @if (selected()!.description) {
            <p>{{ selected()!.description }}</p>
          }
          <div class="chips">
            <span class="chip chip-neutral">{{ prioLabel(selected()!.priority) }}</span>
            <span class="chip chip-neutral">👤 {{ selected()!.assigneeName ?? 'Sin asignar' }}</span>
            @if (selected()!.dueDate) {
              <span class="chip chip-neutral">📅 {{ shortDate(selected()!.dueDate) }}</span>
            }
            <span class="chip chip-neutral">{{ statusLabel(selected()!.status) }}</span>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .nav { display: flex; align-items: center; gap: 6px; }
    .month { font-weight: 650; min-width: 140px; text-align: center; }
    .grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 6px;
    }
    .wd {
      text-align: center;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--text-secondary);
      padding: 6px 0;
    }
    .day {
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      min-height: 96px;
      background: var(--surface);
      padding: 6px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .day.other { opacity: 0.4; background: var(--surface-2); }
    .day.today { border-color: var(--primary); box-shadow: 0 0 0 1px var(--primary) inset; }
    .day-num {
      font-size: 12px;
      font-weight: 650;
      color: var(--text-secondary);
      text-align: right;
    }
    .day.today .day-num {
      color: var(--primary);
      background: var(--primary-soft);
      border-radius: 50%;
      width: 22px;
      margin-left: auto;
      text-align: center;
      line-height: 22px;
    }
    .tasks { display: flex; flex-direction: column; gap: 3px; overflow: hidden; }
    .task {
      border: none;
      background: var(--primary-soft);
      color: var(--primary);
      font-size: 11px;
      font-weight: 600;
      text-align: left;
      padding: 4px 6px;
      border-radius: 4px;
      cursor: pointer;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-family: inherit;
    }
    .task.high { background: var(--danger-soft); color: var(--danger); }
    .task.medium { background: var(--warning-soft); color: var(--warning); }
    .task.low { background: var(--success-soft); color: var(--success); }
    .task.overdue { text-decoration: line-through; }
    .detail { margin-top: 16px; }
    .detail h3 { margin: 0 0 6px; }
    .detail p { margin: 0 0 10px; color: var(--text-secondary); font-size: 13px; }
    .chips { display: flex; gap: 8px; flex-wrap: wrap; }
    @media (max-width: 720px) {
      .grid { grid-template-columns: repeat(1, 1fr); }
      .wd { display: none; }
    }
  `,
})
export class CalendarComponent {
  readonly svc = inject(TasksService);
  readonly selected = signal<TaskItem | null>(null);
  readonly cursor = signal(new Date());

  readonly weekdays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  readonly cells = computed(() => {
    const c = this.cursor();
    const first = new Date(c.getFullYear(), c.getMonth(), 1);
    const startOffset = (first.getDay() + 6) % 7;
    const start = new Date(first);
    start.setDate(first.getDate() - startOffset);
    const items: Array<{ key: string; day: number; date: string; other: boolean; isToday: boolean }> = [];
    const today = new Date();
    const todayKey = today.toISOString().slice(0, 10);
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      items.push({
        key,
        day: d.getDate(),
        date: key,
        other: d.getMonth() !== c.getMonth(),
        isToday: key === todayKey,
      });
    }
    return items;
  });

  readonly monthLabel = computed(() => {
    const c = this.cursor();
    return new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' })
      .format(c)
      .replace(/^./, (x) => x.toUpperCase());
  });

  constructor() {
    void this.svc.load();
  }

  tasksOn(date: string): TaskItem[] {
    return this.svc
      .tasks()
      .filter((t) => t.dueDate && String(t.dueDate).slice(0, 10) === date);
  }

  shift(m: number): void {
    const c = new Date(this.cursor());
    c.setMonth(c.getMonth() + m);
    this.cursor.set(c);
  }

  today(): void {
    this.cursor.set(new Date());
  }

  select(t: TaskItem): void {
    this.selected.set(t);
  }

  prioLabel(p: TaskItem['priority']): string {
    return p === 'high' ? 'Alta' : p === 'medium' ? 'Media' : 'Baja';
  }

  statusLabel(s: TaskItem['status']): string {
    return s === 'todo' ? 'Por hacer' : s === 'doing' ? 'En curso' : 'Hecho';
  }

  shortDate(d: string | null): string {
    return d ? String(d).slice(0, 10) : '';
  }

  isOverdue(t: TaskItem): boolean {
    if (!t.dueDate || t.status === 'done') return false;
    const today = new Date().toISOString().slice(0, 10);
    return String(t.dueDate).slice(0, 10) < today;
  }
}
