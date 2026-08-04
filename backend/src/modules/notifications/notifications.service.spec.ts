import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { NotificationsService } from './notifications.service';
import { Notification } from './notification.entity';
import { FcmService } from './fcm.service';
import { DataSource } from 'typeorm';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repo: {
    create: jest.Mock;
    save: jest.Mock;
    findAndCount: jest.Mock;
    count: jest.Mock;
    update: jest.Mock;
  };
  let dataSource: { query: jest.Mock };
  let fcm: { pushToUser: jest.Mock };

  const notification = {
    id: 1,
    userId: 2,
    type: 'CHAT',
    title: 'Nuevo mensaje',
    message: 'Hola',
    isRead: false,
  };

  beforeEach(async () => {
    repo = {
      create: jest.fn((d) => d),
      save: jest.fn((d) => Promise.resolve({ id: 1, ...d })),
      findAndCount: jest.fn().mockResolvedValue([[notification], 1]),
      count: jest.fn().mockResolvedValue(0),
      update: jest.fn().mockResolvedValue({}),
    };
    dataSource = { query: jest.fn().mockResolvedValue([]) };
    fcm = { pushToUser: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(Notification), useValue: repo },
        { provide: DataSource, useValue: dataSource },
        { provide: FcmService, useValue: fcm },
      ],
    }).compile();

    service = module.get(NotificationsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('create guarda, emite al bus y dispara push', async () => {
    const saved = await service.create(2, 'CHAT', 'Título', 'Mensaje', {
      url: '/chat/1',
    });

    expect(saved.id).toBe(1);
    expect(fcm.pushToUser).toHaveBeenCalledWith(2, 'Título', 'Mensaje', {
      type: 'CHAT',
      url: '/chat/1',
    });
  });

  it('create serializa valores no string del payload FCM', async () => {
    await service.create(2, 'LOW_STOCK', 'Stock', 'Bajo', { url: 42 });

    expect(fcm.pushToUser).toHaveBeenCalledWith(2, 'Stock', 'Bajo', {
      type: 'LOW_STOCK',
      url: 42,
    });
  });

  it('createForRoles no hace nada con lista vacía', async () => {
    await service.createForRoles([], 'X', 'Y');

    expect(dataSource.query).not.toHaveBeenCalled();
  });

  it('createForRoles crea una notificación por usuario con ese rol', async () => {
    dataSource.query.mockResolvedValue([{ id: 1 }, { id: 2 }]);

    await service.createForRoles(['ADMIN'], 'ANN', 'Aviso');

    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('role = ANY($1)'),
      [['ADMIN']],
    );
    expect(repo.save).toHaveBeenCalledTimes(2);
  });

  it('list devuelve items, total y no leídos', async () => {
    repo.count.mockResolvedValue(3);

    const result = await service.list(2, 1, 20);

    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.unread).toBe(3);
  });

  it('markRead marca una notificación específica', async () => {
    await service.markRead(2, 9);

    expect(repo.update).toHaveBeenCalledWith(
      { userId: 2, id: 9 },
      { isRead: true },
    );
  });

  it('markAllRead marca todas como leídas', async () => {
    await service.markAllRead(2);

    expect(repo.update).toHaveBeenCalledWith(
      { userId: 2, isRead: false },
      { isRead: true },
    );
  });

  it('unreadCount cuenta las no leídas', async () => {
    repo.count.mockResolvedValue(7);

    await expect(service.unreadCount(2)).resolves.toBe(7);
  });

  it('stream solo emite eventos del usuario propio', async () => {
    const first = firstValueFrom(service.stream(2));

    await service.create(2, 'CHAT', 'A', 'msg');
    await service.create(3, 'CHAT', 'B', 'msg');

    const event = await first;
    expect(event.data).toEqual(expect.objectContaining({ userId: 2 }));
  });
});
