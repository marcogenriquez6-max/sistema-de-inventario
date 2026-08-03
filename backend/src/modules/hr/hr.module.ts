import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from './employee.entity';
import { HrService } from './hr.service';
import { HrController } from './hr.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([Employee]), AuditModule],
  controllers: [HrController],
  providers: [HrService],
  exports: [HrService],
})
export class HrModule {}
