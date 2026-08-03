import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
export interface RefreshJwtPayload {
    sub: string;
    email: string;
    fullName: string;
    role: string;
}
declare const JwtRefreshStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtRefreshStrategy extends JwtRefreshStrategy_base {
    constructor(configService: ConfigService);
    validate(payload: RefreshJwtPayload): Promise<RefreshJwtPayload>;
}
export {};
