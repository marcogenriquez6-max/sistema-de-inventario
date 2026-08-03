import { DataSource, Repository } from 'typeorm';
import { CashRegister } from './cash-register.entity';
import { CashMovement } from './cash-movement.entity';
import { OpenRegisterDto, CashMovementDto, CloseRegisterDto } from './dto/cash-register.dto';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import { Request } from 'express';
export declare class CashRegisterService {
    private readonly registerRepo;
    private readonly movementRepo;
    private readonly auditService;
    private readonly dataSource;
    constructor(registerRepo: Repository<CashRegister>, movementRepo: Repository<CashMovement>, auditService: AuditService, dataSource: DataSource);
    getOpenRegister(userId: number): Promise<CashRegister | null>;
    openRegister(dto: OpenRegisterDto, user: AuthUser, req: Request): Promise<CashRegister>;
    addMovement(registerId: number, dto: CashMovementDto, user: AuthUser, req: Request): Promise<CashMovement>;
    closeRegister(registerId: number, dto: CloseRegisterDto, user: AuthUser, req: Request): Promise<CashRegister>;
    getMovements(registerId: number, page: number, pageSize: number): Promise<{
        items: CashMovement[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    private round2;
}
