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
exports.SuppliersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const supplier_entity_1 = require("./supplier.entity");
const domain_exceptions_1 = require("../../common/domain-exceptions");
const paginated_interface_1 = require("../../common/interfaces/paginated.interface");
const audit_service_1 = require("../audit/audit.service");
let SuppliersService = class SuppliersService {
    constructor(supplierRepo, auditService) {
        this.supplierRepo = supplierRepo;
        this.auditService = auditService;
    }
    async findAll(query) {
        const { page, pageSize } = query;
        const qb = this.supplierRepo
            .createQueryBuilder('s')
            .orderBy('s.name', 'ASC');
        if (query.q) {
            qb.andWhere(new typeorm_2.Brackets((qb2) => {
                qb2
                    .where('s.name ILIKE :q')
                    .orWhere('s.code ILIKE :q')
                    .orWhere('s.taxId ILIKE :q');
            }), { q: `%${query.q}%` });
        }
        const [items, total] = await qb
            .skip((page - 1) * pageSize)
            .take(pageSize)
            .getManyAndCount();
        return (0, paginated_interface_1.toPaginated)(items, total, page, pageSize);
    }
    async findOne(id) {
        const supplier = await this.supplierRepo.findOne({ where: { id } });
        if (!supplier) {
            throw new domain_exceptions_1.DomainException(404, 'Proveedor no encontrado');
        }
        return supplier;
    }
    async create(dto, user, req) {
        try {
            const supplier = await this.supplierRepo.save(this.supplierRepo.create(dto));
            await this.auditService.record({
                userId: user.id,
                action: 'SUPPLIER:CREATE',
                resourceType: 'suppliers',
                resourceId: supplier.id,
                metadata: { code: dto.code, name: dto.name },
                request: req,
            });
            return supplier;
        }
        catch (err) {
            if (err.driverError?.code ===
                '23505') {
                throw new domain_exceptions_1.DomainException(409, 'Ya existe un proveedor con ese código o NIT');
            }
            throw err;
        }
    }
    async update(id, dto, user, req) {
        const supplier = await this.findOne(id);
        Object.assign(supplier, dto);
        const saved = await this.supplierRepo.save(supplier);
        await this.auditService.record({
            userId: user.id,
            action: 'SUPPLIER:UPDATE',
            resourceType: 'suppliers',
            resourceId: id,
            metadata: { changes: Object.keys(dto) },
            request: req,
        });
        return saved;
    }
};
exports.SuppliersService = SuppliersService;
exports.SuppliersService = SuppliersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(supplier_entity_1.Supplier)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        audit_service_1.AuditService])
], SuppliersService);
//# sourceMappingURL=suppliers.service.js.map