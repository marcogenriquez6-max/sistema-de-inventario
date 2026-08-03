import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { randomUUID } from 'crypto';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';
import { RefreshToken } from './refresh-token.entity';
import { LoginDto } from './dto/login.dto';
import { AuditService } from '../audit/audit.service';
import { RefreshJwtPayload } from './strategies/jwt-refresh.strategy';
import { Request } from 'express';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthSession {
  tokens: AuthTokens;
  user: { id: number; email: string; fullName: string; role: string };
}

export interface IssuedTokens {
  tokens: AuthTokens;
  jti: string;
}

/**
 * Autenticación: login, rotación de refresh tokens y logout.
 * Usa dos secretos distintos (access/refresh) y hashea el refresh token
 * en BD (si se filtra la BD, no se pueden emitir sesiones).
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
    @InjectRepository(RefreshToken)
    private readonly tokenRepo: Repository<RefreshToken>,
  ) {}

  async login(dto: LoginDto, req: Request): Promise<AuthSession> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    const valid =
      user &&
      (await argon2.verify(user.passwordHash, dto.password).catch(() => false));

    if (!user || !valid) {
      await this.auditService.record({
        userId: null,
        action: 'AUTH:LOGIN_FAILED',
        resourceType: 'auth',
        resourceId: dto.email,
        metadata: { reason: 'invalid_credentials' },
        request: req,
      });
      throw new UnauthorizedException('Credenciales inválidas');
    }
    if (!user.isActive) {
      throw new UnauthorizedException(
        'Cuenta desactivada. Contacte al administrador',
      );
    }

    const tokens = await this.issueTokens(user.id, req);
    await this.auditService.record({
      userId: user.id,
      action: 'AUTH:LOGIN',
      resourceType: 'auth',
      request: req,
    });

    return {
      tokens: tokens.tokens,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  /**
   * Rotación del refresh token: el token presentado se revoca y se emite
   * uno nuevo (detección de reuso: si llega un token ya rotado, se invalidan
   * todas las sesiones del usuario).
   */
  async refresh(refreshToken: string, req: Request): Promise<AuthTokens> {
    let payload: RefreshJwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshJwtPayload>(
        refreshToken,
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        },
      );
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    const stored = await this.tokenRepo.findOne({
      where: { jti: payload.sub },
    });

    if (!stored || stored.revokedAt) {
      if (stored && stored.revokedAt) {
        // Token ya usado → posible robo: revocar toda la cadena del usuario.
        await this.revokeAllForUser(stored.userId);
      }
      throw new UnauthorizedException('Sesión no válida o ya rotada');
    }

    const matches = await argon2.verify(stored.tokenHash, refreshToken);
    if (!matches) {
      throw new UnauthorizedException('Sesión no válida');
    }
    if (stored.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Sesión expirada');
    }

    stored.revokedAt = new Date();
    await this.tokenRepo.save(stored);

    const issued = await this.issueTokens(stored.userId, req);
    stored.replacedByJti = issued.jti;
    await this.tokenRepo.save(stored);

    return issued.tokens;
  }

  async logout(refreshToken: string): Promise<void> {
    let payload: RefreshJwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshJwtPayload>(
        refreshToken,
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        },
      );
    } catch {
      return;
    }
    await this.tokenRepo.update(
      { jti: payload.sub },
      { revokedAt: new Date() },
    );
  }

  /** Emite access + refresh y persiste la sesión. */
  private async issueTokens(
    userId: number,
    req: Request,
  ): Promise<{ tokens: AuthTokens; jti: string }> {
    const user = await this.usersService.findById(userId);
    const jti = randomUUID();

    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.getOrThrow<string>('JWT_ACCESS_EXPIRES'),
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: jti, email: user.email, fullName: user.fullName, role: user.role },
      {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRES'),
      },
    );

    const expiresMs = this.parseExpires(
      this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRES'),
    );
    await this.tokenRepo.save(
      this.tokenRepo.create({
        jti,
        userId,
        tokenHash: await argon2.hash(refreshToken),
        expiresAt: new Date(Date.now() + expiresMs),
        ip: req.ip ?? null,
        userAgent: req.headers['user-agent']?.slice(0, 300) ?? null,
      }),
    );

    return {
      tokens: {
        accessToken,
        refreshToken,
        expiresIn:
          this.parseExpires(
            this.configService.getOrThrow<string>('JWT_ACCESS_EXPIRES'),
          ) / 1000,
      },
      jti,
    };
  }

  private async revokeAllForUser(userId: number): Promise<void> {
    await this.tokenRepo.update({ userId }, { revokedAt: new Date() });
  }

  /** Interpreta duraciones tipo "15m", "7d", "1h". */
  private parseExpires(expr: string): number {
    const unit = expr.slice(-1).toLowerCase();
    const amount = Number(expr.slice(0, -1));
    const ms = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit] ?? 1000;
    return amount * ms;
  }

  /** Limpieza de tokens vencidos (llamada periódica opcional). */
  async cleanupExpired(): Promise<number> {
    const result = await this.tokenRepo.delete({
      expiresAt: LessThan(new Date()),
    });
    return result.affected ?? 0;
  }
}
