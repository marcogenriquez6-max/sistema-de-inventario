import { Request } from 'express';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { AuthUser } from '../../common/decorators/current-user.decorator';
export declare class DocumentsController {
    private readonly documentsService;
    constructor(documentsService: DocumentsService);
    findAll(query: PaginationDto & {
        q?: string;
        category?: string;
    }): Promise<import("../../common/interfaces/paginated.interface").Paginated<import("./document.entity").DocumentRecord>>;
    findOne(id: number): Promise<import("./document.entity").DocumentRecord>;
    create(dto: CreateDocumentDto, user: AuthUser, req: Request): Promise<import("./document.entity").DocumentRecord>;
    remove(id: number, user: AuthUser, req: Request): Promise<void>;
}
