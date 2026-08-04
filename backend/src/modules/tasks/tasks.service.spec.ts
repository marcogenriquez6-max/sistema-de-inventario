import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TasksService } from './tasks.service';
import { Task } from './task.entity';

function mockQb(getMany?: jest.Mock, getRawOne?: jest.Mock) {
  const qb: Record<string, jest.Mock> = {};
  for (const m of ['orderBy', 'addOrderBy', 'andWhere', 'where', 'select']) {
    qb[m] = jest.fn().mockReturnThis();
  }
  if (getMany) qb.getMany = getMany;
  if (getRawOne) qb.getRawOne = getRawOne;
  return qb as never;
}

describe('TasksService', () => {
  let service: TasksService;
  let repo: {
    createQueryBuilder: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    delete: jest.Mock;
  };
  let dataSource: { query: jest.Mock };

  const task = {
    id: 1,
    title: 'Preparar pedido',
    status: 'todo',
    priority: 'high',
    assigneeId: 2,
    boardOrder: 0,
    createdBy: 1,
  };

  beforeEach(async () => {
    repo = {
      createQueryBuilder: jest.fn(),
      create: jest.fn((d) => d),
      save: jest.fn((d) => Promise.resolve({ id: 1, ...d })),
      findOne: jest.fn(),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    dataSource = { query: jest.fn().mockResolvedValue([]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task), useValue: repo },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get(TasksService);
  });

  afterEach(() => jest.clearAllMocks());

  it('list aplica filtros de status, assignee y texto', async () => {
    repo.createQueryBuilder.mockReturnValue(
      mockQb(jest.fn().mockResolvedValue([task])),
    );

    const result = await service.list('todo', 2, 'pedido');

    expect(result).toHaveLength(1);
    expect(repo.createQueryBuilder().andWhere).toHaveBeenCalledTimes(3);
  });

  it('list enriquece con el nombre del asignado', async () => {
    repo.createQueryBuilder.mockReturnValue(
      mockQb(jest.fn().mockResolvedValue([task])),
    );
    dataSource.query.mockResolvedValue([{ id: 2, name: 'Ana Rojas' }]);

    const result = await service.list();

    expect(result[0].assigneeName).toBe('Ana Rojas');
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('ANY($1)'),
      [[2]],
    );
  });

  it('list deja assigneeName null cuando no hay asignado', async () => {
    repo.createQueryBuilder.mockReturnValue(
      mockQb(jest.fn().mockResolvedValue([{ ...task, assigneeId: null }])),
    );

    const result = await service.list();

    expect(result[0].assigneeName).toBeNull();
    expect(dataSource.query).not.toHaveBeenCalled();
  });

  it('create asigna el siguiente board_order por status', async () => {
    repo.createQueryBuilder.mockReturnValue(
      mockQb(undefined, jest.fn().mockResolvedValue({ max: 3 })),
    );

    const result = await service.create(1, {
      title: 'Nueva tarea',
      status: 'todo',
      priority: 'medium',
    });

    expect(result.boardOrder).toBe(4);
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ boardOrder: 4, createdBy: 1 }),
    );
  });

  it('update lanza NotFoundException si la tarea no existe', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.update(9, { title: 'X' })).rejects.toThrow(
      'Tarea no encontrada',
    );
  });

  it('update aplica los cambios del DTO', async () => {
    repo.findOne.mockResolvedValue(task);
    repo.save.mockImplementation((d) => Promise.resolve({ ...d }));

    const result = await service.update(1, { title: 'Actualizado' });

    expect(result.title).toBe('Actualizado');
  });

  it('move asigna boardOrder explícito si viene en el DTO', async () => {
    repo.findOne.mockResolvedValue(task);

    const result = await service.move(1, { status: 'doing', boardOrder: 7 });

    expect(result.status).toBe('doing');
    expect(result.boardOrder).toBe(7);
  });

  it('move calcula el boardOrder si no viene', async () => {
    repo.findOne.mockResolvedValue(task);
    repo.createQueryBuilder.mockReturnValue(
      mockQb(undefined, jest.fn().mockResolvedValue({ max: 1 })),
    );

    const result = await service.move(1, { status: 'done' });

    expect(result.boardOrder).toBe(2);
  });

  it('remove lanza NotFoundException cuando no afecta filas', async () => {
    repo.delete.mockResolvedValue({ affected: 0 });

    await expect(service.remove(9)).rejects.toThrow('Tarea no encontrada');
  });

  it('remove elimina la tarea', async () => {
    await expect(service.remove(1)).resolves.toBeUndefined();
    expect(repo.delete).toHaveBeenCalledWith({ id: 1 });
  });
});
