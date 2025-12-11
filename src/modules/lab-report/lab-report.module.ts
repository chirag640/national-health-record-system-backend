import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LabReportController } from './lab-report.controller';
import { LabReportService } from './lab-report.service';
import { LabReportRepository } from './lab-report.repository';
import { LabReport, LabReportSchema } from './schemas/lab-report.schema';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: LabReport.name, schema: LabReportSchema }]),
    NotificationModule, // For sending notifications on critical results
  ],
  controllers: [LabReportController],
  providers: [LabReportService, LabReportRepository],
  exports: [LabReportService, LabReportRepository],
})
export class LabReportModule {}
