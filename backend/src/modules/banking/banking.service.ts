import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BankAccount } from './bank-account.entity';
import { BankMovement } from './bank-movement.entity';
import {
  CreateBankAccountDto,
  BankMovementDto,
  TransferDto,
} from './dto/banking.dto';
import { DomainException } from '../../common/domain-exceptions';
import {
  toPaginated,
  Paginated,
} from '../../common/interfaces/paginated.interface';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import { Request } from 'express';

/** Módulo de bancos y tesorería: cuentas, movimientos y transferencias. */
@Injectable()
export class BankingService {
  constructor(
    @InjectRepository(BankAccount)
    private readonly accountRepo: Repository<BankAccount>,
    @InjectRepository(BankMovement)
    private readonly movementRepo: Repository<BankMovement>,
    private readonly auditService: AuditService,
    private readonly dataSource: DataSource,
  ) {}

  async listAccounts(): Promise<BankAccount[]> {
    return this.accountRepo.find({ order: { name: 'ASC' } });
  }

  async createAccount(
    dto: CreateBankAccountDto,
    user: AuthUser,
    req: Request,
  ): Promise<BankAccount> {
    const account = await this.accountRepo.save(
      this.accountRepo.create({
        ...dto,
        accountType: dto.accountType ?? 'SAVINGS',
        currency: dto.currency ?? 'BOB',
        balance: (dto.balance ?? 0).toFixed(2),
      }),
    );
    await this.auditService.record({
      userId: user.id,
      action: 'BANK:ACCOUNT_CREATE',
      resourceType: 'bank_accounts',
      resourceId: account.id,
      metadata: { name: dto.name, bank: dto.bank },
      request: req,
    });
    return account;
  }

  async addMovement(
    accountId: number,
    dto: BankMovementDto,
    user: AuthUser,
    req: Request,
  ): Promise<BankMovement> {
    return this.dataSource.transaction(async (manager) => {
      const account = await manager.findOne(BankAccount, {
        where: { id: accountId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!account) {
        throw new DomainException(404, 'Cuenta bancaria no encontrada');
      }
      const sign = dto.movementType === 'DEPOSIT' ? 1 : -1;
      const newBalance = Number(account.balance) + sign * dto.amount;
      if (newBalance < 0) {
        throw new DomainException(409, 'Saldo insuficiente en la cuenta', {
          balance: Number(account.balance),
        });
      }
      account.balance = newBalance.toFixed(2);
      await manager.save(BankAccount, account);

      const movement = manager.create(BankMovement, {
        accountId,
        movementType: dto.movementType,
        amount: dto.amount.toFixed(2),
        description: dto.description ?? null,
        userId: user.id,
      });
      await manager.save(BankMovement, movement);

      await this.auditService.record({
        userId: user.id,
        action: `BANK:${dto.movementType}`,
        resourceType: 'bank_movements',
        resourceId: movement.id,
        metadata: { accountId, amount: dto.amount },
        request: req,
      });
      return movement;
    });
  }

  async transfer(
    fromAccountId: number,
    dto: TransferDto,
    user: AuthUser,
    req: Request,
  ): Promise<void> {
    if (fromAccountId === dto.toAccountId) {
      throw new DomainException(
        422,
        'No se puede transferir a la misma cuenta',
      );
    }
    await this.dataSource.transaction(async (manager) => {
      const from = await manager.findOne(BankAccount, {
        where: { id: fromAccountId },
        lock: { mode: 'pessimistic_write' },
      });
      const to = await manager.findOne(BankAccount, {
        where: { id: dto.toAccountId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!from || !to) {
        throw new DomainException(404, 'Cuenta bancaria no encontrada');
      }
      if (Number(from.balance) < dto.amount) {
        throw new DomainException(
          409,
          'Saldo insuficiente en la cuenta origen',
        );
      }

      from.balance = (Number(from.balance) - dto.amount).toFixed(2);
      to.balance = (Number(to.balance) + dto.amount).toFixed(2);
      await manager.save(BankAccount, from);
      await manager.save(BankAccount, to);

      await manager.save(
        manager.create(BankMovement, {
          accountId: from.id,
          movementType: 'TRANSFER_OUT',
          amount: dto.amount.toFixed(2),
          description: dto.description ?? 'Transferencia',
          userId: user.id,
        }),
      );
      await manager.save(
        manager.create(BankMovement, {
          accountId: to.id,
          movementType: 'TRANSFER_IN',
          amount: dto.amount.toFixed(2),
          description: dto.description ?? 'Transferencia',
          userId: user.id,
        }),
      );
    });
    await this.auditService.record({
      userId: user.id,
      action: 'BANK:TRANSFER',
      resourceType: 'bank_movements',
      metadata: {
        from: fromAccountId,
        to: dto.toAccountId,
        amount: dto.amount,
      },
      request: req,
    });
  }

  async movements(
    accountId: number,
    page = 1,
    pageSize = 20,
  ): Promise<Paginated<BankMovement>> {
    const [items, total] = await this.movementRepo.findAndCount({
      where: { accountId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return toPaginated(items, total, page, pageSize);
  }
}
