import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

/**
 * Payload del refresh token. A diferencia del access token, `sub` es el jti
 * (identificador de sesión), no el id del usuario.
 */
export interface RefreshJwtPayload {
  sub: string;
  email: string;
  fullName: string;
  role: string;
}

/**
 * Strategy para el refresh token (header Authorization: Bearer <refresh>).
 * Solo valida la firma; la rotación/revocación se gestiona en AuthService.
 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: false,
    });
  }

  async validate(payload: RefreshJwtPayload): Promise<RefreshJwtPayload> {
    return payload;
  }
}
