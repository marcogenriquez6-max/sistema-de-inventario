import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UsersService } from '../users/users.service';
import { AuthUser } from '../../common/decorators/current-user.decorator';
export declare class AuthController {
    private readonly authService;
    private readonly usersService;
    constructor(authService: AuthService, usersService: UsersService);
    login(dto: LoginDto, req: Request): Promise<import("./auth.service").AuthSession>;
    refresh(dto: RefreshDto, req: Request): Promise<import("./auth.service").AuthTokens>;
    logout(dto: RefreshDto): Promise<void>;
    changePassword(dto: ChangePasswordDto, user: AuthUser): Promise<void>;
}
