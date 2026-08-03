import { Request } from 'express';
import { BankingService } from './banking.service';
import { CreateBankAccountDto, BankMovementDto, TransferDto } from './dto/banking.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { AuthUser } from '../../common/decorators/current-user.decorator';
export declare class BankingController {
    private readonly bankingService;
    constructor(bankingService: BankingService);
    accounts(): Promise<import("./bank-account.entity").BankAccount[]>;
    createAccount(dto: CreateBankAccountDto, user: AuthUser, req: Request): Promise<import("./bank-account.entity").BankAccount>;
    addMovement(id: number, dto: BankMovementDto, user: AuthUser, req: Request): Promise<import("./bank-movement.entity").BankMovement>;
    transfer(id: number, dto: TransferDto, user: AuthUser, req: Request): Promise<{
        ok: boolean;
    }>;
    movements(id: number, query: PaginationDto): Promise<import("../../common/interfaces/paginated.interface").Paginated<import("./bank-movement.entity").BankMovement>>;
}
