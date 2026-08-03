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
exports.HrService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const employee_entity_1 = require("./employee.entity");
const domain_exceptions_1 = require("../../common/domain-exceptions");
const paginated_interface_1 = require("../../common/interfaces/paginated.interface");
const audit_service_1 = require("../audit/audit.service");
let HrService = class HrService {
    constructor(empRepo, auditService) {
        this.empRepo = empRepo;
        this.auditService = auditService;
    }
    async findAll(query) {
        const { page, pageSize } = query;
        const qb = this.empRepo
            .createQueryBuilder('e')
            .orderBy('e.fullName', 'ASC');
        if (query.q) {
            qb.andWhere(new typeorm_2.Brackets((qb2) => {
                qb2
                    .where('e.fullName ILIKE :q')
                    .orWhere('e.code ILIKE :q')
                    .orWhere('e.documentNumber ILIKE :q');
            }), { q: `%${query.q}%` });
        }
        if (query.department) {
            qb.andWhere('e.department = :department', {
                department: query.department,
            });
        }
        const [items, total] = await qb
            .skip((page - 1) * pageSize)
            .take(pageSize)
            .getManyAndCount();
        return (0, paginated_interface_1.toPaginated)(items, total, page, pageSize);
    }
    async findOne(id) {
        const employee = await this.empRepo.findOne({ where: { id } });
        if (!employee) {
            throw new domain_exceptions_1.DomainException(404, 'Empleado no encontrado');
        }
        return employee;
    }
    async create(dto, user, req) {
        try {
            const employee = await this.empRepo.save(this.empRepo.create(dto));
            await this.auditService.record({
                userId: user.id,
                action: 'EMPLOYEE:CREATE',
                resourceType: 'employees',
                resourceId: employee.id,
                metadata: { code: dto.code, fullName: dto.fullName },
                request: req,
            });
            return employee;
        }
        catch (err) {
            if (err.driverError?.code ===
                '23505') {
                throw new domain_exceptions_1.DomainException(409, 'Ya existe un empleado con ese código');
            }
            throw err;
        }
    }
    async update(id, dto, user, req) {
        const employee = await this.findOne(id);
        Object.assign(employee, dto);
        const saved = await this.empRepo.save(employee);
        await this.auditService.record({
            userId: user.id,
            action: 'EMPLOYEE:UPDATE',
            resourceType: 'employees',
            resourceId: id,
            metadata: { changes: Object.keys(dto) },
            request: req,
        });
        return saved;
    }
};
exports.HrService = HrService;
exports.HrService = HrService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(employee_entity_1.Employee)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        audit_service_1.AuditService])
], HrService);
//# sourceMappingURL=hr.service.js.map