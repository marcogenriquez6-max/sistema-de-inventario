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
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const customer_entity_1 = require("./customer.entity");
const domain_exceptions_1 = require("../../common/domain-exceptions");
const paginated_interface_1 = require("../../common/interfaces/paginated.interface");
const audit_service_1 = require("../audit/audit.service");
let CustomersService = class CustomersService {
    constructor(customerRepo, auditService) {
        this.customerRepo = customerRepo;
        this.auditService = auditService;
    }
    async findAll(query) {
        const { page, pageSize } = query;
        const qb = this.customerRepo
            .createQueryBuilder('c')
            .orderBy('c.name', 'ASC');
        if (query.q) {
            qb.andWhere(new typeorm_2.Brackets((qb2) => {
                qb2
                    .where('c.name ILIKE :q')
                    .orWhere('c.code ILIKE :q')
                    .orWhere('c.documentNumber ILIKE :q');
            }), { q: `%${query.q}%` });
        }
        if (query.isActive !== undefined) {
            qb.andWhere('c.isActive = :active', { active: query.isActive === 1 });
        }
        const [items, total] = await qb
            .skip((page - 1) * pageSize)
            .take(pageSize)
            .getManyAndCount();
        return (0, paginated_interface_1.toPaginated)(items, total, page, pageSize);
    }
    async findOne(id) {
        const customer = await this.customerRepo.findOne({ where: { id } });
        if (!customer) {
            throw new domain_exceptions_1.DomainException(404, 'Cliente no encontrado');
        }
        return customer;
    }
    async generateCode() {
        const prefix = 'CLI-';
        const row = await this.customerRepo
            .createQueryBuilder('c')
            .select('c.code', 'code')
            .where('c.code LIKE :prefix', { prefix: `${prefix}%` })
            .orderBy('LENGTH(c.code)', 'DESC')
            .addOrderBy('c.code', 'DESC')
            .limit(1)
            .getRawOne();
        const last = row?.code;
        const num = last ? Number.parseInt(last.slice(prefix.length), 10) || 0 : 0;
        return `${prefix}${String(num + 1).padStart(5, '0')}`;
    }
    async create(dto, user, req) {
        try {
            const code = dto.code?.trim() || (await this.generateCode());
            const customer = await this.customerRepo.save(this.customerRepo.create({ ...dto, code }));
            await this.auditService.record({
                userId: user.id,
                action: 'CUSTOMER:CREATE',
                resourceType: 'customers',
                resourceId: customer.id,
                metadata: { code, name: dto.name },
                request: req,
            });
            return customer;
        }
        catch (err) {
            if (err.driverError?.code ===
                '23505') {
                throw new domain_exceptions_1.DomainException(409, 'Ya existe un cliente con ese código o documento');
            }
            throw err;
        }
    }
    async update(id, dto, user, req) {
        const customer = await this.findOne(id);
        Object.assign(customer, dto);
        const saved = await this.customerRepo.save(customer);
        await this.auditService.record({
            userId: user.id,
            action: 'CUSTOMER:UPDATE',
            resourceType: 'customers',
            resourceId: id,
            metadata: { changes: Object.keys(dto) },
            request: req,
        });
        return saved;
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(customer_entity_1.Customer)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        audit_service_1.AuditService])
], CustomersService);
//# sourceMappingURL=customers.service.js.map