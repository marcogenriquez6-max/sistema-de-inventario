import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { ChatService } from './chat.service';
import { ChatRoom } from './chat-room.entity';
import { ChatRoomMember } from './chat-member.entity';
import { ChatMessage } from './chat-message.entity';
import { NotificationsService } from '../notifications/notifications.service';

describe('ChatService', () => {
  let service: ChatService;
  let rooms: {
    create: jest.Mock;
    save: jest.Mock;
  };
  let members: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
  };
  let messages: {
    createQueryBuilder: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let dataSource: { query: jest.Mock };
  let notifications: { create: jest.Mock };

  beforeEach(async () => {
    rooms = {
      create: jest.fn((d) => d),
      save: jest.fn((d) => Promise.resolve({ id: 1, ...d })),
    };
    members = {
      create: jest.fn((d) => d),
      save: jest.fn((d) => Promise.resolve(d)),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
    };
    messages = {
      createQueryBuilder: jest.fn(),
      create: jest.fn((d) => d),
      save: jest.fn((d) => Promise.resolve({ id: 1, ...d })),
    };
    dataSource = { query: jest.fn().mockResolvedValue([]) };
    notifications = { create: jest.fn().mockResolvedValue({}) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: getRepositoryToken(ChatRoom), useValue: rooms },
        { provide: getRepositoryToken(ChatRoomMember), useValue: members },
        { provide: getRepositoryToken(ChatMessage), useValue: messages },
        { provide: DataSource, useValue: dataSource },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    service = module.get(ChatService);
  });

  afterEach(() => jest.clearAllMocks());

  it('listRooms agrupa participantes por sala', async () => {
    dataSource.query
      .mockResolvedValueOnce([
        {
          id: 1,
          type: 'direct',
          name: 'Ana',
          createdAt: new Date(),
          lastMessage: 'Hola',
          lastMessageAt: new Date(),
          lastSender: 'Ana',
          unreadCount: 2,
        },
      ])
      .mockResolvedValueOnce([
        { roomId: 1, id: 2, name: 'Ana', role: 'SELLER' },
      ]);

    const result = await service.listRooms(1);

    expect(result[0].participants).toEqual([
      { id: 2, name: 'Ana', role: 'SELLER' },
    ]);
  });

  it('createRoom rechaza participantes inexistentes o inactivos', async () => {
    dataSource.query.mockResolvedValue([{ id: 2, full_name: 'Ana' }]);

    await expect(
      service.createRoom(1, { type: 'group', participantIds: [2, 99] }),
    ).rejects.toThrow('Algunos participantes no existen');
  });

  it('createRoom asigna el nombre de una sala directa', async () => {
    dataSource.query
      .mockResolvedValueOnce([
        { id: 2, full_name: 'Ana Rojas' },
        { id: 1, full_name: 'Yo' },
      ])
      .mockResolvedValueOnce([
        {
          id: 1,
          type: 'direct',
          name: 'Ana Rojas',
          createdAt: new Date(),
          lastMessage: null,
          lastMessageAt: null,
          lastSender: null,
          unreadCount: 0,
        },
      ])
      .mockResolvedValueOnce([
        { roomId: 1, id: 2, name: 'Ana Rojas', role: 'SELLER' },
      ]);

    const room = await service.createRoom(1, {
      type: 'direct',
      participantIds: [2],
    });

    expect(rooms.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'direct', name: 'Ana Rojas' }),
    );
    expect(room.name).toBe('Ana Rojas');
  });

  it('getMessages lanza NotFound si el usuario no es miembro', async () => {
    members.findOne.mockResolvedValue(null);

    await expect(service.getMessages(1, 9)).rejects.toThrow(
      'Sala no encontrada',
    );
  });

  it('getMessages pagina después de un afterId', async () => {
    members.findOne.mockResolvedValue({ id: 1 });
    const qb: Record<string, jest.Mock> = {
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([{ id: 5 }]),
    };
    messages.createQueryBuilder.mockReturnValue(qb as never);

    const result = await service.getMessages(1, 1, 4);

    expect(result).toHaveLength(1);
    expect(qb.andWhere).toHaveBeenCalledWith('m.id > :afterId', { afterId: 4 });
  });

  it('sendMessage emite al bus y notifica a los demás miembros', async () => {
    members.findOne.mockResolvedValue({ id: 1 });
    members.find.mockResolvedValue([
      { userId: 1 },
      { userId: 2 },
      { userId: 3 },
    ]);

    await service.sendMessage(1, 1, 'Hola equipo');

    expect(messages.save).toHaveBeenCalledWith(
      expect.objectContaining({
        roomId: 1,
        senderId: 1,
        content: 'Hola equipo',
      }),
    );
    expect(notifications.create).toHaveBeenCalledTimes(2);
  });

  it('sendMessage trunca el mensaje de notificación a 140 caracteres', async () => {
    members.findOne.mockResolvedValue({ id: 1 });
    members.find.mockResolvedValue([{ userId: 1 }, { userId: 2 }]);
    const long = 'a'.repeat(200);

    await service.sendMessage(1, 1, long);

    expect(notifications.create).toHaveBeenCalledWith(
      2,
      'CHAT',
      'Nuevo mensaje',
      `${'a'.repeat(140)}…`,
      { roomId: 1 },
    );
  });

  it('markRead actualiza last_read_at del miembro', async () => {
    members.findOne.mockResolvedValue({ id: 1 });

    await service.markRead(1, 1);

    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE chat_room_members'),
      [1, 1],
    );
  });

  it('unreadCount suma los mensajes sin leer', async () => {
    dataSource.query.mockResolvedValue([{ total: 4 }]);

    await expect(service.unreadCount(1)).resolves.toBe(4);
  });

  it('unreadCount devuelve 0 si no hay filas', async () => {
    dataSource.query.mockResolvedValue([]);

    await expect(service.unreadCount(1)).resolves.toBe(0);
  });

  it('availableUsers consulta usuarios activos excluyendo al propio', async () => {
    dataSource.query.mockResolvedValue([
      { id: 2, name: 'Ana', role: 'SELLER' },
    ]);

    const result = await service.availableUsers(1, 'an');

    expect(result).toHaveLength(1);
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('id <> $1'),
      [1, '%an%'],
    );
  });

  it('stream solo entrega mensajes del usuario miembro', async () => {
    members.findOne.mockResolvedValue({ id: 1 });
    members.find.mockResolvedValue([{ userId: 1 }, { userId: 2 }]);
    const first = firstValueFrom(service.stream(2));

    await service.sendMessage(1, 1, 'Hola');

    const event = await first;
    expect(event.type).toBe('message');
    expect(event.data).toEqual(expect.objectContaining({ senderId: 1 }));
  });
});
