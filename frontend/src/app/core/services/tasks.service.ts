import { Injectable, signal } from '@angular/core';
import { ApiService } from './api.service';

export interface TaskItem {
  id: number;
  title: string;
  description: string | null;
  status: 'todo' | 'doing' | 'done';
  priority: 'low' | 'medium' | 'high';
  assigneeId: number | null;
  assigneeName: string | null;
  dueDate: string | null;
  boardOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskUser {
  id: number;
  name: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class TasksService {
  readonly tasks = signal<TaskItem[]>([]);
  readonly loading = signal(false);
  readonly users = signal<TaskUser[]>([]);

  constructor(private api: ApiService) {}

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const tasks = await this.api.get<TaskItem[]>('/tasks').toPromise();
      this.tasks.set(tasks ?? []);
    } finally {
      this.loading.set(false);
    }
  }

  async loadUsers(): Promise<void> {
    const users = await this.api.get<TaskUser[]>('/chat/users').toPromise();
    this.users.set(users ?? []);
  }

  async create(data: {
    title: string;
    description?: string;
    status: TaskItem['status'];
    priority: TaskItem['priority'];
    assigneeId?: number;
    dueDate?: string;
  }): Promise<TaskItem | null> {
    const task = await this.api.post<TaskItem>('/tasks', data).toPromise();
    if (!task) return null;
    this.tasks.set([...this.tasks(), task]);
    return task;
  }

  async update(id: number, data: Partial<TaskItem>): Promise<void> {
    const task = await this.api.patch<TaskItem>(`/tasks/${id}`, data).toPromise();
    if (task) this.tasks.set(this.tasks().map((t) => (Number(t.id) === Number(id) ? task : t)));
  }

  async move(id: number, status: TaskItem['status'], boardOrder?: number): Promise<void> {
    const task = await this.api
      .patch<TaskItem>(`/tasks/${id}/move`, { status, boardOrder })
      .toPromise();
    if (task) this.tasks.set(this.tasks().map((t) => (Number(t.id) === Number(id) ? task : t)));
  }

  async remove(id: number): Promise<void> {
    await this.api.delete(`/tasks/${id}`).toPromise().catch(() => undefined);
    this.tasks.set(this.tasks().filter((t) => Number(t.id) !== Number(id)));
  }
}
