import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CashRegister } from './cash-register.entity';
import { CashMovement } from './cash-movement.entity';
import {
  OpenRegisterDto,
  CashMovementDto,
  CloseRegisterDto,
} from './dto/cash-register.dto';
import { DomainException } from '../../common/domain-exceptions';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import { Request } from 'express';

/**
 * Módulo de caja: apertura, movimientos y cierre con arqueo.
 * La caja solo puede estar abierta una por vez por operador.
 */
@Injectable()
export class CashRegisterService {
  constructor(
    @InjectRepository(CashRegister)
    private readonly registerRepo: Repository<CashRegister>,
    @InjectRepository(CashMovement)
    private readonly movementRepo: Repository<CashMovement>,
    private readonly auditService: AuditService,
    private readonly dataSource: DataSource,
  ) {}

  async getOpenRegister(userId: number): Promise<CashRegister | null> {
    return this.registerRepo.findOne({
      where: { openedBy: userId, status: 'OPEN' },
    });
  }

  async openRegister(
    dto: OpenRegisterDto,
    user: AuthUser,
    req: Request,
  ): Promise<CashRegister> {
    const existing = await this.getOpenRegister(user.id);
    if (existing) {
      throw new DomainException(409, 'Ya tienes una caja abierta');
    }
    const register = this.registerRepo.create({
      openedBy: user.id,
      initialBalance: dto.initialBalance.toFixed(2),
      expected: dto.initialBalance.toFixed(2),
      status: 'OPEN',
    });
    const saved = await this.registerRepo.save(register);
    await this.auditService.record({
      userId: user.id,
      action: 'CASH:OPEN',
      resourceType: 'cash_registers',
      resourceId: saved.id,
      metadata: { initialBalance: dto.initialBalance },
      request: req,
    });
    return saved;
  }

  async addMovement(
    registerId: number,
    dto: CashMovementDto,
    user: AuthUser,
    req: Request,
  ): Promise<CashMovement> {
    const register = await this.registerRepo.findOne({
      where: { id: registerId },
    });
    if (!register || register.status !== 'OPEN') {
      throw new DomainException(409, 'La caja no está abierta');
    }

    return this.dataSource.transaction(async (manager) => {
      const locked = await manager.findOne(CashRegister, {
        where: { id: registerId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!locked || locked.status !== 'OPEN') {
        throw new DomainException(409, 'La caja no está abierta');
      }

      const sign = dto.movementType === 'INCOME' ? 1 : -1;
      locked.expected = (Number(locked.expected) + sign * dto.amount).toFixed(
        2,
      );
      await manager.save(CashRegister, locked);

      const movement = manager.create(CashMovement, {
        registerId,
        movementType: dto.movementType,
        amount: dto.amount.toFixed(2),
        description: dto.description ?? null,
        userId: user.id,
      });
      await manager.save(CashMovement, movement);

      await this.auditService.record({
        userId: user.id,
        action: `CASH:${dto.movementType}`,
        resourceType: 'cash_movements',
        resourceId: movement.id,
        metadata: { registerId, amount: dto.amount },
        request: req,
      });
      return movement;
    });
  }

  async closeRegister(
    registerId: number,
    dto: CloseRegisterDto,
    user: AuthUser,
    req: Request,
  ): Promise<CashRegister> {
    return this.dataSource.transaction(async (manager) => {
      const register = await manager.findOne(CashRegister, {
        where: { id: registerId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!register || register.status !== 'OPEN') {
        throw new DomainException(
          409,
          'La caja no está abierta o ya fue cerrada',
        );
      }

      const expected = Number(register.expected);
      const difference = this.round2(dto.countedAmount - expected);

      register.status = 'CLOSED';
      register.countedAmount = dto.countedAmount.toFixed(2);
      register.difference = difference.toFixed(2);
      register.closedBy = user.id;
      register.closedAt = new Date();
      const saved = await manager.save(CashRegister, register);

      await this.auditService.record({
        userId: user.id,
        action: 'CASH:CLOSE',
        resourceType: 'cash_registers',
        resourceId: registerId,
        metadata: { expected, counted: dto.countedAmount, difference },
        request: req,
      });
      return saved;
    });
  }

  async getMovements(registerId: number, page: number, pageSize: number) {
    const [items, total] = await this.movementRepo.findAndCount({
      where: { registerId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total, page, pageSize };
  }

  private round2(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
