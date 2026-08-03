import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BankAccount } from './bank-account.entity';
import { BankMovement } from './bank-movement.entity';
import { BankingService } from './banking.service';
import { BankingController } from './banking.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([BankAccount, BankMovement]), AuditModule],
  controllers: [BankingController],
  providers: [BankingService],
  exports: [BankingService],
})
export class BankingModule {}
