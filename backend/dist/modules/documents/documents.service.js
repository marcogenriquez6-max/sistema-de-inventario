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
exports.DocumentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const document_entity_1 = require("./document.entity");
const domain_exceptions_1 = require("../../common/domain-exceptions");
const paginated_interface_1 = require("../../common/interfaces/paginated.interface");
const audit_service_1 = require("../audit/audit.service");
let DocumentsService = class DocumentsService {
    constructor(docRepo, auditService) {
        this.docRepo = docRepo;
        this.auditService = auditService;
    }
    async findAll(query) {
        const { page, pageSize } = query;
        const qb = this.docRepo
            .createQueryBuilder('d')
            .orderBy('d.createdAt', 'DESC');
        if (query.q) {
            qb.andWhere(new typeorm_2.Brackets((qb2) => {
                qb2.where('d.name ILIKE :q').orWhere('d.category ILIKE :q');
            }), { q: `%${query.q}%` });
        }
        if (query.category) {
            qb.andWhere('d.category = :category', { category: query.category });
        }
        const [items, total] = await qb
            .skip((page - 1) * pageSize)
            .take(pageSize)
            .getManyAndCount();
        return (0, paginated_interface_1.toPaginated)(items, total, page, pageSize);
    }
    async findOne(id) {
        const doc = await this.docRepo.findOne({ where: { id } });
        if (!doc) {
            throw new domain_exceptions_1.DomainException(404, 'Documento no encontrado');
        }
        return doc;
    }
    async create(dto, user, req) {
        const doc = await this.docRepo.save(this.docRepo.create({
            ...dto,
            referenceId: dto.referenceId != null ? String(dto.referenceId) : null,
            uploadedBy: user.id,
        }));
        await this.auditService.record({
            userId: user.id,
            action: 'DOCUMENT:CREATE',
            resourceType: 'documents',
            resourceId: doc.id,
            metadata: { name: dto.name },
            request: req,
        });
        return doc;
    }
    async remove(id, user, req) {
        const doc = await this.findOne(id);
        await this.docRepo.remove(doc);
        await this.auditService.record({
            userId: user.id,
            action: 'DOCUMENT:DELETE',
            resourceType: 'documents',
            resourceId: id,
            metadata: { name: doc.name },
            request: req,
        });
    }
};
exports.DocumentsService = DocumentsService;
exports.DocumentsService = DocumentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(document_entity_1.DocumentRecord)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        audit_service_1.AuditService])
], DocumentsService);
//# sourceMappingURL=documents.service.js.map