import { DataSource, Repository } from 'typeorm';
import { BankAccount } from './bank-account.entity';
import { BankMovement } from './bank-movement.entity';
import { CreateBankAccountDto, BankMovementDto, TransferDto } from './dto/banking.dto';
import { Paginated } from '../../common/interfaces/paginated.interface';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import { Request } from 'express';
export declare class BankingService {
    private readonly accountRepo;
    private readonly movementRepo;
    private readonly auditService;
    private readonly dataSource;
    constructor(accountRepo: Repository<BankAccount>, movementRepo: Repository<BankMovement>, auditService: AuditService, dataSource: DataSource);
    listAccounts(): Promise<BankAccount[]>;
    createAccount(dto: CreateBankAccountDto, user: AuthUser, req: Request): Promise<BankAccount>;
    addMovement(accountId: number, dto: BankMovementDto, user: AuthUser, req: Request): Promise<BankMovement>;
    transfer(fromAccountId: number, dto: TransferDto, user: AuthUser, req: Request): Promise<void>;
    movements(accountId: number, page?: number, pageSize?: number): Promise<Paginated<BankMovement>>;
}
