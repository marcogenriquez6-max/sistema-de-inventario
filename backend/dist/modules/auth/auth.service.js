"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const crypto_1 = require("crypto");
const argon2 = require("argon2");
const users_service_1 = require("../users/users.service");
const refresh_token_entity_1 = require("./refresh-token.entity");
const audit_service_1 = require("../audit/audit.service");
let AuthService = class AuthService {
    constructor(usersService, jwtService, configService, auditService, tokenRepo) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.auditService = auditService;
        this.tokenRepo = tokenRepo;
    }
    async login(dto, req) {
        const user = await this.usersService.findByEmailWithPassword(dto.email);
        const valid = user &&
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
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('Cuenta desactivada. Contacte al administrador');
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
    async refresh(refreshToken, req) {
        let payload;
        try {
            payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
            });
        }
        catch {
            throw new common_1.UnauthorizedException('Refresh token inválido o expirado');
        }
        const stored = await this.tokenRepo.findOne({
            where: { jti: payload.sub },
        });
        if (!stored || stored.revokedAt) {
            if (stored && stored.revokedAt) {
                await this.revokeAllForUser(stored.userId);
            }
            throw new common_1.UnauthorizedException('Sesión no válida o ya rotada');
        }
        const matches = await argon2.verify(stored.tokenHash, refreshToken);
        if (!matches) {
            throw new common_1.UnauthorizedException('Sesión no válida');
        }
        if (stored.expiresAt.getTime() < Date.now()) {
            throw new common_1.UnauthorizedException('Sesión expirada');
        }
        stored.revokedAt = new Date();
        await this.tokenRepo.save(stored);
        const issued = await this.issueTokens(stored.userId, req);
        stored.replacedByJti = issued.jti;
        await this.tokenRepo.save(stored);
        return issued.tokens;
    }
    async logout(refreshToken) {
        let payload;
        try {
            payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
            });
        }
        catch {
            return;
        }
        await this.tokenRepo.update({ jti: payload.sub }, { revokedAt: new Date() });
    }
    async issueTokens(userId, req) {
        const user = await this.usersService.findById(userId);
        const jti = (0, crypto_1.randomUUID)();
        const accessToken = await this.jwtService.signAsync({
            sub: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
        }, {
            secret: this.configService.getOrThrow('JWT_ACCESS_SECRET'),
            expiresIn: this.configService.getOrThrow('JWT_ACCESS_EXPIRES'),
        });
        const refreshToken = await this.jwtService.signAsync({ sub: jti, email: user.email, fullName: user.fullName, role: user.role }, {
            secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.getOrThrow('JWT_REFRESH_EXPIRES'),
        });
        const expiresMs = this.parseExpires(this.configService.getOrThrow('JWT_REFRESH_EXPIRES'));
        await this.tokenRepo.save(this.tokenRepo.create({
            jti,
            userId,
            tokenHash: await argon2.hash(refreshToken),
            expiresAt: new Date(Date.now() + expiresMs),
            ip: req.ip ?? null,
            userAgent: req.headers['user-agent']?.slice(0, 300) ?? null,
        }));
        return {
            tokens: {
                accessToken,
                refreshToken,
                expiresIn: this.parseExpires(this.configService.getOrThrow('JWT_ACCESS_EXPIRES')) / 1000,
            },
            jti,
        };
    }
    async revokeAllForUser(userId) {
        await this.tokenRepo.update({ userId }, { revokedAt: new Date() });
    }
    parseExpires(expr) {
        const unit = expr.slice(-1).toLowerCase();
        const amount = Number(expr.slice(0, -1));
        const ms = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit] ?? 1000;
        return amount * ms;
    }
    async cleanupExpired() {
        const result = await this.tokenRepo.delete({
            expiresAt: (0, typeorm_2.LessThan)(new Date()),
        });
        return result.affected ?? 0;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, typeorm_1.InjectRepository)(refresh_token_entity_1.RefreshToken)),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService,
        audit_service_1.AuditService,
        typeorm_2.Repository])
], AuthService);
//# sourceMappingURL=auth.service.js.map