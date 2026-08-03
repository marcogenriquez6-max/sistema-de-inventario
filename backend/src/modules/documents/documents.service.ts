import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { DocumentRecord } from './document.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { DomainException } from '../../common/domain-exceptions';
import {
  toPaginated,
  Paginated,
} from '../../common/interfaces/paginated.interface';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import { Request } from 'express';

/** Gestión documental: registro de archivos con metadatos. */
@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(DocumentRecord)
    private readonly docRepo: Repository<DocumentRecord>,
    private readonly auditService: AuditService,
  ) {}

  async findAll(query: {
    page: number;
    pageSize: number;
    q?: string;
    category?: string;
  }): Promise<Paginated<DocumentRecord>> {
    const { page, pageSize } = query;
    const qb = this.docRepo
      .createQueryBuilder('d')
      .orderBy('d.createdAt', 'DESC');
    if (query.q) {
      qb.andWhere(
        new Brackets((qb2) => {
          qb2.where('d.name ILIKE :q').orWhere('d.category ILIKE :q');
        }),
        { q: `%${query.q}%` },
      );
    }
    if (query.category) {
      qb.andWhere('d.category = :category', { category: query.category });
    }
    const [items, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();
    return toPaginated(items, total, page, pageSize);
  }

  async findOne(id: number): Promise<DocumentRecord> {
    const doc = await this.docRepo.findOne({ where: { id } });
    if (!doc) {
      throw new DomainException(404, 'Documento no encontrado');
    }
    return doc;
  }

  async create(
    dto: CreateDocumentDto,
    user: AuthUser,
    req: Request,
  ): Promise<DocumentRecord> {
    const doc = await this.docRepo.save(
      this.docRepo.create({
        ...dto,
        referenceId: dto.referenceId != null ? String(dto.referenceId) : null,
        uploadedBy: user.id,
      } as Partial<DocumentRecord>),
    );
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

  async remove(id: number, user: AuthUser, req: Request): Promise<void> {
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
}
