import { PaginationDto } from '../../../common/dto/pagination.dto';
export declare class QueryProductDto extends PaginationDto {
    q?: string;
    brand?: string;
    category?: string;
    vehicleBrand?: string;
    vehicleModel?: string;
    year?: number;
    lowStock?: number;
}
