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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const argon2 = require("argon2");
const user_entity_1 = require("./user.entity");
const domain_exceptions_1 = require("../../common/domain-exceptions");
const paginated_interface_1 = require("../../common/interfaces/paginated.interface");
const audit_service_1 = require("../audit/audit.service");
let UsersService = class UsersService {
    constructor(userRepo, auditService) {
        this.userRepo = userRepo;
        this.auditService = auditService;
    }
    async findByEmail(email) {
        return this.userRepo.findOne({ where: { email } });
    }
    async findByEmailWithPassword(email) {
        return this.userRepo
            .createQueryBuilder('u')
            .addSelect('u.passwordHash')
            .where('u.email = :email', { email })
            .getOne();
    }
    async findById(id) {
        const user = await this.userRepo.findOne({ where: { id } });
        if (!user) {
            throw new domain_exceptions_1.DomainException(404, 'Usuario no encontrado');
        }
        return user;
    }
    async findAll(query) {
        const { page, pageSize, search, role, isActive } = query;
        const where = {};
        if (role) {
            where.role = role;
        }
        if (isActive !== undefined) {
            where.isActive = isActive === 1;
        }
        if (search) {
            where.email = (0, typeorm_2.Like)(`%${search}%`);
        }
        const [items, total] = await this.userRepo.findAndCount({
            where,
            order: { fullName: 'ASC' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });
        return (0, paginated_interface_1.toPaginated)(items, total, page, pageSize);
    }
    async create(dto, actor, req) {
        const existing = await this.findByEmail(dto.email);
        if (existing) {
            throw new domain_exceptions_1.DomainException(409, 'Ya existe un usuario con ese correo');
        }
        const user = this.userRepo.create({
            email: dto.email,
            fullName: dto.fullName,
            passwordHash: await argon2.hash(dto.password),
            role: dto.role,
            isActive: dto.isActive ?? true,
        });
        const saved = await this.userRepo.save(user);
        await this.auditService.record({
            userId: actor.id,
            action: 'USER:CREATE',
            resourceType: 'users',
            resourceId: saved.id,
            metadata: { email: dto.email, role: dto.role },
            request: req,
        });
        return saved;
    }
    async update(id, dto, actor, req) {
        const user = await this.findById(id);
        if (dto.fullName !== undefined) {
            user.fullName = dto.fullName;
        }
        if (dto.role !== undefined) {
            user.role = dto.role;
        }
        if (dto.isActive !== undefined) {
            user.isActive = dto.isActive;
        }
        if (dto.password !== undefined) {
            user.passwordHash = await argon2.hash(dto.password);
        }
        const saved = await this.userRepo.save(user);
        await this.auditService.record({
            userId: actor.id,
            action: 'USER:UPDATE',
            resourceType: 'users',
            resourceId: id,
            metadata: { changes: Object.keys(dto) },
            request: req,
        });
        return saved;
    }
    async changePassword(id, currentPassword, newPassword) {
        const user = await this.userRepo
            .createQueryBuilder('u')
            .addSelect('u.passwordHash')
            .where('u.id = :id', { id })
            .getOne();
        if (!user) {
            throw new domain_exceptions_1.DomainException(404, 'Usuario no encontrado');
        }
        const valid = await argon2.verify(user.passwordHash, currentPassword);
        if (!valid) {
            throw new domain_exceptions_1.DomainException(401, 'La contraseña actual es incorrecta');
        }
        user.passwordHash = await argon2.hash(newPassword);
        await this.userRepo.save(user);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        audit_service_1.AuditService])
], UsersService);
//# sourceMappingURL=users.service.js.map