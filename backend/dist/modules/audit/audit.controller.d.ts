import { AuditService } from './audit.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
declare class QueryAuditDto extends PaginationDto {
    userId?: number;
    action?: string;
    resourceType?: string;
}
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    findAll(query: QueryAuditDto): Promise<import("../../common/interfaces/paginated.interface").Paginated<import("./audit-log.entity").AuditLog>>;
}
export {};
