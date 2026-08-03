import { PaginationDto } from '../../../common/dto/pagination.dto';
import { Role } from '../../../common/decorators/roles.decorator';
export declare class QueryUserDto extends PaginationDto {
    role?: Role;
    isActive?: number;
}
