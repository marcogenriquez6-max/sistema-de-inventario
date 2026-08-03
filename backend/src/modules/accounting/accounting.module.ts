import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './account.entity';
import { JournalEntry } from './journal-entry.entity';
import { JournalLine } from './journal-line.entity';
import { AccountingService } from './accounting.service';
import { AccountingController } from './accounting.controller';
import { SettingsModule } from '../settings/settings.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Account, JournalEntry, JournalLine]),
    SettingsModule,
    AuditModule,
  ],
  controllers: [AccountingController],
  providers: [AccountingService],
  exports: [AccountingService],
})
export class AccountingModule {}
