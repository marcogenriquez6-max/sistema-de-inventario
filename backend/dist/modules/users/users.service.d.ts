import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Paginated } from '../../common/interfaces/paginated.interface';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import { Request } from 'express';
export declare class UsersService {
    private readonly userRepo;
    private readonly auditService;
    constructor(userRepo: Repository<User>, auditService: AuditService);
    findByEmail(email: string): Promise<User | null>;
    findByEmailWithPassword(email: string): Promise<User | null>;
    findById(id: number): Promise<User>;
    findAll(query: {
        page: number;
        pageSize: number;
        search?: string;
        role?: string;
        isActive?: number;
    }): Promise<Paginated<User>>;
    create(dto: CreateUserDto, actor: AuthUser, req: Request): Promise<User>;
    update(id: number, dto: UpdateUserDto, actor: AuthUser, req: Request): Promise<User>;
    changePassword(id: number, currentPassword: string, newPassword: string): Promise<void>;
}
