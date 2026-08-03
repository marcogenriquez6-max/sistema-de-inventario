import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { RefreshToken } from './refresh-token.entity';
import { LoginDto } from './dto/login.dto';
import { AuditService } from '../audit/audit.service';
import { Request } from 'express';
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export interface AuthSession {
    tokens: AuthTokens;
    user: {
        id: number;
        email: string;
        fullName: string;
        role: string;
    };
}
export interface IssuedTokens {
    tokens: AuthTokens;
    jti: string;
}
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    private readonly configService;
    private readonly auditService;
    private readonly tokenRepo;
    constructor(usersService: UsersService, jwtService: JwtService, configService: ConfigService, auditService: AuditService, tokenRepo: Repository<RefreshToken>);
    login(dto: LoginDto, req: Request): Promise<AuthSession>;
    refresh(refreshToken: string, req: Request): Promise<AuthTokens>;
    logout(refreshToken: string): Promise<void>;
    private issueTokens;
    private revokeAllForUser;
    private parseExpires;
    cleanupExpired(): Promise<number>;
}
