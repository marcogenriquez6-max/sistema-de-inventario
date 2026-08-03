import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUser } from '../../../common/decorators/current-user.decorator';

export interface JwtPayload {
  sub: number;
  email: string;
  fullName: string;
  role: string;
}

/** Strategy de access token. Inyecta el AuthUser en cada request protegido. */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    return {
      id: payload.sub,
      email: payload.email,
      fullName: payload.fullName,
      role: payload.role,
    };
  }
}
