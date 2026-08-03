import { Role } from '../../../common/decorators/roles.decorator';
export declare class UpdateUserDto {
    fullName?: string;
    password?: string;
    role?: Role;
    isActive?: boolean;
}
