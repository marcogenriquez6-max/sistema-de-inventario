import { Request } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { AuthUser } from '../../common/decorators/current-user.decorator';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(query: QueryUserDto): Promise<import("../../common/interfaces/paginated.interface").Paginated<import("./user.entity").User>>;
    findOne(id: number): Promise<import("./user.entity").User>;
    create(dto: CreateUserDto, user: AuthUser, req: Request): Promise<import("./user.entity").User>;
    update(id: number, dto: UpdateUserDto, user: AuthUser, req: Request): Promise<import("./user.entity").User>;
}
