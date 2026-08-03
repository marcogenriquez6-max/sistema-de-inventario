import { Request } from 'express';
import { CashRegisterService } from './cash-register.service';
import { OpenRegisterDto, CashMovementDto, CloseRegisterDto } from './dto/cash-register.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { AuthUser } from '../../common/decorators/current-user.decorator';
export declare class CashRegisterController {
    private readonly cashRegisterService;
    constructor(cashRegisterService: CashRegisterService);
    open(dto: OpenRegisterDto, user: AuthUser, req: Request): Promise<import("./cash-register.entity").CashRegister>;
    mine(user: AuthUser): Promise<import("./cash-register.entity").CashRegister | null>;
    addMovement(id: number, dto: CashMovementDto, user: AuthUser, req: Request): Promise<import("./cash-movement.entity").CashMovement>;
    movements(id: number, query: PaginationDto): Promise<{
        items: import("./cash-movement.entity").CashMovement[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    close(id: number, dto: CloseRegisterDto, user: AuthUser, req: Request): Promise<import("./cash-register.entity").CashRegister>;
}
