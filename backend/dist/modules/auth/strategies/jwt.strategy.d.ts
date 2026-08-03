import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
import { AuthUser } from '../../../common/decorators/current-user.decorator';
export interface JwtPayload {
    sub: number;
    email: string;
    fullName: string;
    role: string;
}
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    constructor(configService: ConfigService);
    validate(payload: JwtPayload): Promise<AuthUser>;
}
export {};
