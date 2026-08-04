import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RefreshToken } from './refresh-token.entity';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';

jest.mock('argon2', () => ({
  verify: jest.fn(),
  hash: jest.fn(),
}));

const mockedVerify = argon2.verify as jest.Mock;
const mockedHash = argon2.hash as jest.Mock;

describe('AuthService', () => {
  let service: AuthService;
  let usersService: {
    findByEmailWithPassword: jest.Mock;
    findById: jest.Mock;
  };
  let jwtService: { signAsync: jest.Mock; verifyAsync: jest.Mock };
  let configService: { getOrThrow: jest.Mock };
  let auditService: { record: jest.Mock };
  let tokenRepo: {
    findOne: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  const user = {
    id: 1,
    email: 'admin@sistema.com',
    fullName: 'Admin',
    role: 'ADMIN',
    isActive: true,
    passwordHash: 'hash',
  };
  const req = {
    ip: '127.0.0.1',
    headers: { 'user-agent': 'jest' },
  } as never;

  const mockConfig = (key: string) => {
    if (key === 'JWT_ACCESS_EXPIRES') return '15m';
    if (key === 'JWT_REFRESH_EXPIRES') return '7d';
    return 'secret';
  };

  beforeEach(async () => {
    usersService = {
      findByEmailWithPassword: jest.fn(),
      findById: jest.fn().mockResolvedValue(user),
    };
    jwtService = { signAsync: jest.fn(), verifyAsync: jest.fn() };
    configService = { getOrThrow: jest.fn(mockConfig) };
    auditService = { record: jest.fn().mockResolvedValue(undefined) };
    tokenRepo = {
      findOne: jest.fn(),
      save: jest.fn().mockResolvedValue({}),
      create: jest.fn((d) => d),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({ affected: 0 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: AuditService, useValue: auditService },
        { provide: getRepositoryToken(RefreshToken), useValue: tokenRepo },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('login', () => {
    it('emite tokens y registra auditoría cuando las credenciales son válidas', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(user);
      mockedVerify.mockResolvedValue(true);
      jwtService.signAsync.mockResolvedValue('signed-token');

      const result = await service.login(
        { email: user.email, password: 'Admin@123' },
        req,
      );

      expect(result.tokens.accessToken).toBe('signed-token');
      expect(result.user).toEqual(
        expect.objectContaining({ id: 1, role: 'ADMIN' }),
      );
      expect(tokenRepo.save).toHaveBeenCalled();
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'AUTH:LOGIN' }),
      );
    });

    it('lanza 401 con credenciales inválidas y audita el fallo', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(user);
      mockedVerify.mockResolvedValue(false);

      await expect(
        service.login({ email: user.email, password: 'wrong' }, req),
      ).rejects.toThrow(UnauthorizedException);
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'AUTH:LOGIN_FAILED' }),
      );
    });

    it('lanza 401 cuando la cuenta está desactivada', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue({
        ...user,
        isActive: false,
      });
      mockedVerify.mockResolvedValue(true);

      await expect(
        service.login({ email: user.email, password: 'Admin@123' }, req),
      ).rejects.toThrow('Cuenta desactivada');
    });
  });

  describe('refresh', () => {
    it('rota la sesión: revoca el viejo y emite uno nuevo', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 'jti-1' });
      tokenRepo.findOne.mockResolvedValue({
        jti: 'jti-1',
        userId: 1,
        tokenHash: 'h',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
      });
      mockedVerify.mockResolvedValue(true);
      jwtService.signAsync.mockResolvedValue('new-token');

      const tokens = await service.refresh('old-refresh', req);

      expect(tokens.accessToken).toBe('new-token');
      expect(tokenRepo.save).toHaveBeenCalled();
    });

    it('invalida toda la cadena si el token ya fue rotado (posible robo)', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 'jti-1' });
      tokenRepo.findOne.mockResolvedValue({
        jti: 'jti-1',
        userId: 1,
        revokedAt: new Date(),
      });

      await expect(service.refresh('reused', req)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(tokenRepo.update).toHaveBeenCalledWith(
        { userId: 1 },
        { revokedAt: expect.any(Date) },
      );
    });

    it('lanza 401 con token inválido', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('bad'));

      await expect(service.refresh('bad', req)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout y limpieza', () => {
    it('no lanza cuando el token ya es inválido', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('bad'));

      await expect(service.logout('bad')).resolves.toBeUndefined();
    });

    it('revoca el token válido', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 'jti-1' });

      await service.logout('good');

      expect(tokenRepo.update).toHaveBeenCalledWith(
        { jti: 'jti-1' },
        { revokedAt: expect.any(Date) },
      );
    });

    it('cleanupExpired elimina tokens vencidos', async () => {
      tokenRepo.delete.mockResolvedValue({ affected: 3 });

      await expect(service.cleanupExpired()).resolves.toBe(3);
    });
  });

  describe('issueTokens', () => {
    it('calcula la expiración en milisegundos desde la cadena', () => {
      expect(
        (
          service as unknown as { parseExpires: (e: string) => number }
        ).parseExpires('15m'),
      ).toBe(900000);
      expect(
        (
          service as unknown as { parseExpires: (e: string) => number }
        ).parseExpires('7d'),
      ).toBe(7 * 86400000);
    });

    it('hashea el refresh token antes de persistirlo', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(user);
      usersService.findById.mockResolvedValue(user);
      mockedHash.mockResolvedValue('hashed-refresh');
      jwtService.signAsync.mockResolvedValue('t');

      await service.login({ email: user.email, password: 'Admin@123' }, req);

      expect(mockedHash).toHaveBeenCalled();
    });
  });
});
