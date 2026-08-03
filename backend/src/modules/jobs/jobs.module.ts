import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { ReportsProcessor } from './reports.processor';
import { NotificationsProcessor } from './notifications.processor';
import { ReportsModule } from '../reports/reports.module';

@Module({
  imports: [ReportsModule],
  providers: [JobsService, ReportsProcessor, NotificationsProcessor],
  exports: [JobsService],
})
export class JobsModule {}
