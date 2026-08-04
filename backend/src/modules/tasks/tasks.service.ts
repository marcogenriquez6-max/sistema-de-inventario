import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Task } from './task.entity';
import { CreateTaskDto, MoveTaskDto, UpdateTaskDto } from './dto/task.dto';

export interface TaskView extends Task {
  assigneeName: string | null;
}

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly repo: Repository<Task>,
    private readonly dataSource: DataSource,
  ) {}

  private async withAssignee(rows: Task[]): Promise<TaskView[]> {
    if (rows.length === 0) return [];
    const ids = rows
      .map((r) => r.assigneeId)
      .filter((id): id is number => id !== null);
    const names = new Map<number, string>();
    if (ids.length > 0) {
      const users = await this.dataSource.query(
        `SELECT id, full_name AS name FROM users WHERE id = ANY($1)`,
        [ids],
      );
      for (const u of users as Array<{ id: number; name: string }>) {
        names.set(Number(u.id), u.name);
      }
    }
    return rows.map((r) => ({
      ...r,
      assigneeName:
        r.assigneeId !== null
          ? (names.get(Number(r.assigneeId)) ?? null)
          : null,
    }));
  }

  async list(
    status?: string,
    assigneeId?: number,
    q?: string,
  ): Promise<TaskView[]> {
    const qb = this.repo
      .createQueryBuilder('t')
      .orderBy('t.board_order', 'ASC')
      .addOrderBy('t.due_date', 'ASC', 'NULLS LAST');
    if (status) qb.andWhere('t.status = :status', { status });
    if (assigneeId !== undefined)
      qb.andWhere('t.assignee_id = :assigneeId', { assigneeId });
    if (q) {
      qb.andWhere('(t.title ILIKE :q OR t.description ILIKE :q)', {
        q: `%${q}%`,
      });
    }
    const rows = await qb.getMany();
    return this.withAssignee(rows);
  }

  async create(userId: number, dto: CreateTaskDto): Promise<TaskView> {
    const maxOrder = await this.repo
      .createQueryBuilder('t')
      .select('COALESCE(MAX(t.board_order), -1)', 'max')
      .where('t.status = :status', { status: dto.status })
      .getRawOne<{ max: number | string }>();
    const boardOrder = Number(maxOrder?.max ?? -1) + 1;
    const task = this.repo.create({
      title: dto.title,
      description: dto.description ?? null,
      status: dto.status,
      priority: dto.priority,
      assigneeId: dto.assigneeId ?? null,
      dueDate: dto.dueDate ?? null,
      boardOrder,
      createdBy: userId,
    });
    const saved = await this.repo.save(task);
    return (await this.withAssignee([saved]))[0];
  }

  async update(id: number, dto: UpdateTaskDto): Promise<TaskView> {
    const task = await this.repo.findOne({ where: { id } });
    if (!task) throw new NotFoundException('Tarea no encontrada');
    Object.assign(task, dto);
    if (dto.dueDate === undefined) task.dueDate = task.dueDate;
    const saved = await this.repo.save(task);
    return (await this.withAssignee([saved]))[0];
  }

  async move(id: number, dto: MoveTaskDto): Promise<TaskView> {
    const task = await this.repo.findOne({ where: { id } });
    if (!task) throw new NotFoundException('Tarea no encontrada');
    if (dto.boardOrder !== undefined) {
      task.boardOrder = dto.boardOrder;
    } else {
      const maxOrder = await this.repo
        .createQueryBuilder('t')
        .select('COALESCE(MAX(t.board_order), -1)', 'max')
        .where('t.status = :status', { status: dto.status })
        .getRawOne<{ max: number | string }>();
      task.boardOrder = Number(maxOrder?.max ?? -1) + 1;
    }
    task.status = dto.status;
    const saved = await this.repo.save(task);
    return (await this.withAssignee([saved]))[0];
  }

  async remove(id: number): Promise<void> {
    const result = await this.repo.delete({ id });
    if (!result.affected) throw new NotFoundException('Tarea no encontrada');
  }
}
