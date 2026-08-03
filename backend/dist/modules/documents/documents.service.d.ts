import { Repository } from 'typeorm';
import { DocumentRecord } from './document.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { Paginated } from '../../common/interfaces/paginated.interface';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import { Request } from 'express';
export declare class DocumentsService {
    private readonly docRepo;
    private readonly auditService;
    constructor(docRepo: Repository<DocumentRecord>, auditService: AuditService);
    findAll(query: {
        page: number;
        pageSize: number;
        q?: string;
        category?: string;
    }): Promise<Paginated<DocumentRecord>>;
    findOne(id: number): Promise<DocumentRecord>;
    create(dto: CreateDocumentDto, user: AuthUser, req: Request): Promise<DocumentRecord>;
    remove(id: number, user: AuthUser, req: Request): Promise<void>;
}
