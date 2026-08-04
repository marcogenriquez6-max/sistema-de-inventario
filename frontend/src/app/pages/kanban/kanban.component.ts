import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TasksService, TaskItem } from '../../core/services/tasks.service';
import { ToastService } from '../../core/services/toast.service';
import { FocusTrapDirective } from '../../core/directives/focus-trap.directive';

const COLUMNS: Array<{ id: TaskItem['status']; label: string; icon: string }> = [
  { id: 'todo', label: 'Por hacer', icon: '📋' },
  { id: 'doing', label: 'En curso', icon: '⏳' },
  { id: 'done', label: 'Hecho', icon: '✅' },
];

function emptyForm() {
  return {
    title: '',
    description: '',
    priority: 'medium' as TaskItem['priority'],
    status: 'todo' as TaskItem['status'],
    assigneeId: null as number | null,
    dueDate: '',
  };
}

@Component({
  selector: 'app-kanban',
  imports: [FormsModule, FocusTrapDirective],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Tablero Kanban</h1>
          <p class="muted small">Organiza el trabajo del equipo en columnas</p>
        </div>
        <button class="btn btn-primary" (click)="openNew()">+ Nueva tarea</button>
      </div>

      <div class="board">
        @for (col of columns; track col.id) {
          <section
            class="col"
            (dragover)="onDragOver($event)"
            (drop)="onDrop($event, col.id)"
            [attr.aria-label]="'Columna ' + col.label"
          >
            <header class="col-head">
              <span class="col-title">{{ col.icon }} {{ col.label }}</span>
              <span class="chip chip-neutral">{{ count(col.id) }}</span>
            </header>
            <div class="cards">
              @for (t of byStatus(col.id); track t.id) {
                <article
                  class="task-card"
                  [class.overdue]="isOverdue(t)"
                  draggable="true"
                  (dragstart)="onDragStart($event, t)"
                  (dblclick)="edit(t)"
                  tabindex="0"
                  [attr.aria-label]="'Tarea ' + t.title"
                >
                  <div class="task-top">
                    <span class="prio" [class]="t.priority">{{ prioLabel(t.priority) }}</span>
                    <button class="del" (click)="remove(t)" aria-label="Eliminar tarea">✕</button>
                  </div>
                  <div class="task-title">{{ t.title }}</div>
                  @if (t.description) {
                    <div class="task-desc">{{ t.description }}</div>
                  }
                  <div class="task-meta">
                    <span>👤 {{ t.assigneeName ?? 'Sin asignar' }}</span>
                    @if (t.dueDate) {
                      <span [class.overdue]="isOverdue(t)">📅 {{ shortDate(t.dueDate) }}</span>
                    }
                  </div>
                </article>
              } @empty {
                <div class="empty">Sin tareas</div>
              }
            </div>
          </section>
        }
      </div>
    </div>

    @if (formOpen()) {
      <div class="backdrop" (click)="formOpen.set(false)">
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-label="Nueva tarea"
          focusTrap
          (focusTrapEscape)="formOpen.set(false)"
          (click)="$event.stopPropagation()"
        >
          <h3>{{ editing() ? 'Editar tarea' : 'Nueva tarea' }}</h3>
          <form (ngSubmit)="save()" novalidate [class.submitted]="submitted()">
            <label class="field">
              Título *
              <input class="input" [(ngModel)]="form.title" name="title" required maxlength="200" />
            </label>
            <label class="field">
              Descripción
              <textarea class="input" rows="3" [(ngModel)]="form.description" name="description"></textarea>
            </label>
            <div class="grid-2">
              <label class="field">
                Prioridad
                <select class="select" [(ngModel)]="form.priority" name="priority">
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </select>
              </label>
              <label class="field">
                Asignado a
                <select class="select" [(ngModel)]="form.assigneeId" name="assigneeId">
                  <option [ngValue]="null">Sin asignar</option>
                  @for (u of svc.users(); track u.id) {
                    <option [ngValue]="u.id">{{ u.name }}</option>
                  }
                </select>
              </label>
            </div>
            <label class="field">
              Fecha límite
              <input class="input" type="date" [(ngModel)]="form.dueDate" name="dueDate" />
            </label>
            <div class="actions">
              <button type="button" class="btn btn-ghost" (click)="formOpen.set(false)">Cancelar</button>
              <button type="submit" class="btn btn-primary">Guardar</button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: `
    .board {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
      align-items: start;
    }
    .col {
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      min-height: 260px;
    }
    .col-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px;
      border-bottom: 1px solid var(--border);
      font-weight: 650;
    }
    .cards { padding: 10px; display: flex; flex-direction: column; gap: 8px; }
    .task-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 10px 12px;
      cursor: grab;
      box-shadow: var(--shadow);
      transition: transform 0.1s, border-color 0.14s;
    }
    .task-card:hover { border-color: var(--primary); transform: translateY(-1px); }
    .task-card.dragging { opacity: 0.5; }
    .task-card.overdue .task-meta { color: var(--danger); }
    .task-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
    .prio {
      font-size: 10.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      padding: 2px 7px;
      border-radius: 999px;
    }
    .prio.low { background: var(--success-soft); color: var(--success); }
    .prio.medium { background: var(--warning-soft); color: var(--warning); }
    .prio.high { background: var(--danger-soft); color: var(--danger); }
    .del {
      border: none;
      background: transparent;
      color: var(--text-disabled);
      cursor: pointer;
      font-size: 12px;
      border-radius: 4px;
      width: 22px;
      height: 22px;
    }
    .del:hover { background: var(--danger); color: #fff; }
    .task-title { font-weight: 600; font-size: 13.5px; color: var(--text); }
    .task-desc {
      font-size: 12px;
      color: var(--text-secondary);
      margin-top: 4px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .task-meta {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      font-size: 11.5px;
      color: var(--text-secondary);
      margin-top: 8px;
      flex-wrap: wrap;
    }
    .empty { padding: 20px; text-align: center; color: var(--text-disabled); font-size: 12.5px; }
    .field { display: flex; flex-direction: column; gap: 5px; font-size: 12.5px; font-weight: 600; margin-bottom: 12px; color: var(--text); }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 6px; }
    @media (max-width: 900px) {
      .board { grid-template-columns: 1fr; }
    }
  `,
})
export class KanbanComponent {
  readonly svc = inject(TasksService);
  private readonly toast = inject(ToastService);
  readonly columns = COLUMNS;
  readonly formOpen = signal(false);
  readonly editing = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly form = emptyForm();
  readonly dragging = signal<TaskItem | null>(null);
  readonly submitted = signal(false);

  constructor() {
    void this.svc.load();
    void this.svc.loadUsers();
  }

  byStatus(status: TaskItem['status']): TaskItem[] {
    return this.svc.tasks().filter((t) => t.status === status);
  }

  count(status: TaskItem['status']): number {
    return this.byStatus(status).length;
  }

  prioLabel(p: TaskItem['priority']): string {
    return p === 'high' ? 'Alta' : p === 'medium' ? 'Media' : 'Baja';
  }

  shortDate(d: string | null): string {
    return d ? String(d).slice(0, 10) : '';
  }

  isOverdue(t: TaskItem): boolean {
    if (!t.dueDate || t.status === 'done') return false;
    const today = new Date().toISOString().slice(0, 10);
    return String(t.dueDate).slice(0, 10) < today;
  }

  openNew(): void {
    this.editing.set(false);
    this.editingId.set(null);
    Object.assign(this.form, emptyForm());
    this.submitted.set(false);
    this.formOpen.set(true);
  }

  edit(t: TaskItem): void {
    this.editing.set(true);
    this.editingId.set(Number(t.id));
    Object.assign(this.form, {
      title: t.title,
      description: t.description ?? '',
      priority: t.priority,
      status: t.status,
      assigneeId: t.assigneeId !== null ? Number(t.assigneeId) : null,
      dueDate: t.dueDate ? String(t.dueDate).slice(0, 10) : '',
    });
    this.submitted.set(false);
    this.formOpen.set(true);
  }

  async save(): Promise<void> {
    if (!this.form.title.trim()) {
      this.submitted.set(true);
      return;
    }
    const id = this.editingId();
    if (id !== null) {
      await this.svc.update(id, this.form as Partial<TaskItem>);
    } else {
      await this.svc.create({
        title: this.form.title,
        description: this.form.description || undefined,
        status: this.form.status,
        priority: this.form.priority,
        assigneeId: this.form.assigneeId ?? undefined,
        dueDate: this.form.dueDate || undefined,
      });
    }
    this.formOpen.set(false);
    this.toast.success('Tarea guardada');
  }

  async remove(t: TaskItem): Promise<void> {
    await this.svc.remove(t.id);
    this.toast.info('Tarea eliminada');
  }

  onDragStart(e: DragEvent, t: TaskItem): void {
    this.dragging.set(t);
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
  }

  onDragOver(e: DragEvent): void {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
  }

  async onDrop(e: DragEvent, status: TaskItem['status']): Promise<void> {
    e.preventDefault();
    const t = this.dragging();
    this.dragging.set(null);
    if (!t || t.status === status) return;
    const list = this.byStatus(status);
    await this.svc.move(t.id, status, list.length);
    this.toast.info(`Tarea movida a «${COLUMNS.find((c) => c.id === status)?.label}»`);
  }
}
