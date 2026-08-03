import { Role } from '../../../common/decorators/roles.decorator';
export declare class CreateUserDto {
    email: string;
    fullName: string;
    password: string;
    role: Role;
    isActive?: boolean;
}
