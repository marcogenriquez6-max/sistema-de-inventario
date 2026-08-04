import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FcmService } from './fcm.service';
import { FcmToken } from './fcm-token.entity';

const mockMessaging = { send: jest.fn().mockResolvedValue('msg-id') };

jest.mock('firebase-admin/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
  cert: jest.fn(),
}));
jest.mock('firebase-admin/messaging', () => ({
  getMessaging: jest.fn(() => mockMessaging),
}));

describe('FcmService', () => {
  let service: FcmService;
  let tokens: {
    findOne: jest.Mock;
    find: jest.Mock;
    update: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(async () => {
    delete process.env.FIREBASE_SERVICE_ACCOUNT;
    mockMessaging.send.mockClear().mockResolvedValue('msg-id');
    tokens = {
      findOne: jest.fn().mockResolvedValue(null),
      find: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({}),
      create: jest.fn((d) => d),
      save: jest.fn((d) => Promise.resolve(d)),
      delete: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FcmService,
        { provide: getRepositoryToken(FcmToken), useValue: tokens },
      ],
    }).compile();

    service = module.get(FcmService);
  });

  afterEach(() => jest.clearAllMocks());

  it('register guarda un token nuevo', async () => {
    await service.register(1, 'tok-abc', 'android');

    expect(tokens.save).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1,
        token: 'tok-abc',
        device: 'android',
      }),
    );
  });

  it('register actualiza el usuario de un token existente', async () => {
    tokens.findOne.mockResolvedValue({
      id: 5,
      token: 'tok-abc',
      device: 'web',
    });

    await service.register(2, 'tok-abc', undefined);

    expect(tokens.update).toHaveBeenCalledWith(5, {
      userId: 2,
      device: 'web',
    });
    expect(tokens.save).not.toHaveBeenCalled();
  });

  it('remove borra el token del usuario', async () => {
    await service.remove(1, 'tok-abc');

    expect(tokens.delete).toHaveBeenCalledWith({
      userId: 1,
      token: 'tok-abc',
    });
  });

  it('pushToUser no hace nada si FCM está deshabilitado', async () => {
    const result = await service.pushToUser(1, 'T', 'B');

    expect(result).toBeUndefined();
    expect(tokens.find).not.toHaveBeenCalled();
    expect(mockMessaging.send).not.toHaveBeenCalled();
  });

  describe('con FCM habilitado', () => {
    beforeEach(() => {
      process.env.FIREBASE_SERVICE_ACCOUNT = '{"project_id":"test"}';
    });

    it('envía push a todos los tokens del usuario', async () => {
      tokens.find.mockResolvedValue([{ token: 'tok-1' }, { token: 'tok-2' }]);

      await service.pushToUser(1, 'Título', 'Cuerpo', { url: '/x' });

      expect(mockMessaging.send).toHaveBeenCalledTimes(2);
      expect(mockMessaging.send).toHaveBeenCalledWith({
        token: 'tok-1',
        notification: { title: 'Título', body: 'Cuerpo' },
        data: { url: '/x' },
      });
    });

    it('serializa valores no string del payload', async () => {
      tokens.find.mockResolvedValue([{ token: 'tok-1' }]);

      await service.pushToUser(1, 'T', 'B', { count: 3, flag: true });

      expect(mockMessaging.send).toHaveBeenCalledWith({
        token: 'tok-1',
        notification: { title: 'T', body: 'B' },
        data: { count: '3', flag: 'true' },
      });
    });

    it('no envía nada si el usuario no tiene tokens', async () => {
      tokens.find.mockResolvedValue([]);

      await service.pushToUser(1, 'T', 'B');

      expect(mockMessaging.send).not.toHaveBeenCalled();
    });

    it('elimina tokens inválidos cuando el push falla', async () => {
      tokens.find.mockResolvedValue([{ token: 'tok-invalid' }]);
      mockMessaging.send.mockRejectedValue({
        code: 'messaging/registration-token-not-registered',
      });

      await service.pushToUser(1, 'T', 'B');

      await new Promise((r) => setImmediate(r));
      expect(tokens.delete).toHaveBeenCalledWith({ token: 'tok-invalid' });
    });

    it('no elimina tokens ante otros errores', async () => {
      tokens.find.mockResolvedValue([{ token: 'tok-ok' }]);
      mockMessaging.send.mockRejectedValue({ code: 'messaging/server-error' });

      await service.pushToUser(1, 'T', 'B');

      await new Promise((r) => setImmediate(r));
      expect(tokens.delete).not.toHaveBeenCalled();
    });
  });
});
