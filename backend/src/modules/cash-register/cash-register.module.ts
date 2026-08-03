import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashRegister } from './cash-register.entity';
import { CashMovement } from './cash-movement.entity';
import { CashRegisterService } from './cash-register.service';
import { CashRegisterController } from './cash-register.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CashRegister, CashMovement]),
    AuditModule,
  ],
  controllers: [CashRegisterController],
  providers: [CashRegisterService],
  exports: [CashRegisterService],
})
export class CashRegisterModule {}
