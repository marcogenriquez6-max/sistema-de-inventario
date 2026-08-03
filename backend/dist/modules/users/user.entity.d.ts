import { Role } from '../../common/decorators/roles.decorator';
export declare class User {
    id: number;
    email: string;
    passwordHash: string;
    fullName: string;
    role: Role;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
