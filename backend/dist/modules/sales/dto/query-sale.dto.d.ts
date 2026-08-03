import { PaginationDto } from '../../../common/dto/pagination.dto';
export declare class QuerySaleDto extends PaginationDto {
    docType?: 'NOTA' | 'FACTURA';
    status?: 'COMPLETED' | 'VOIDED';
    from?: string;
    to?: string;
    q?: string;
}
