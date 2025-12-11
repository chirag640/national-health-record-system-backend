import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { plainToClass } from 'class-transformer';
import { LabReportRepository } from './lab-report.repository';
import { CreateLabReportDto } from './dto/create-lab-report.dto';
import { UpdateLabReportDto } from './dto/update-lab-report.dto';
import { LabReportFilterDto } from './dto/lab-report-filter.dto';
import {
  LabReportOutputDto,
  PaginatedLabReportsDto,
  TrendAnalysisDto,
} from './dto/lab-report-output.dto';
import { LabReportDocument, LabReportStatus, TestResultStatus } from './schemas/lab-report.schema';
import { NotificationService } from '../notification/notification.service';
import {
  NotificationType,
  NotificationPriority,
  NotificationChannel,
} from '../notification/schemas/notification.schema';

@Injectable()
export class LabReportService {
  private readonly logger = new Logger(LabReportService.name);

  constructor(
    private readonly labReportRepository: LabReportRepository,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Create a new lab report
   */
  async create(createDto: CreateLabReportDto): Promise<LabReportOutputDto> {
    this.logger.log(`Creating lab report for patient ${createDto.patientId}`);

    // Convert string IDs to ObjectIds
    const data: any = { ...createDto };
    if (data.doctorId) {
      data.doctorId = new Types.ObjectId(data.doctorId);
    }
    if (data.hospitalId) {
      data.hospitalId = new Types.ObjectId(data.hospitalId);
    }
    if (data.labId) {
      data.labId = new Types.ObjectId(data.labId);
    }
    if (data.appointmentId) {
      data.appointmentId = new Types.ObjectId(data.appointmentId);
    }
    if (data.encounterId) {
      data.encounterId = new Types.ObjectId(data.encounterId);
    }

    const labReport = await this.labReportRepository.create(data);

    // Check for critical results and send immediate notification
    const hasCritical = labReport.results.some((r) => r.status === TestResultStatus.CRITICAL);
    if (hasCritical && !labReport.criticalNotificationSent) {
      await this.sendCriticalResultNotification(labReport);
    }

    // If report is completed, notify patient and doctor
    if (labReport.status === LabReportStatus.COMPLETED) {
      await this.sendReportCompletedNotifications(labReport);
    }

    return plainToClass(LabReportOutputDto, labReport.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Find lab report by ID
   */
  async findById(id: string): Promise<LabReportOutputDto> {
    const labReport = await this.labReportRepository.findById(id);
    if (!labReport) {
      throw new NotFoundException(`Lab report with ID ${id} not found`);
    }
    return plainToClass(LabReportOutputDto, labReport.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Find lab report by report ID
   */
  async findByReportId(reportId: string): Promise<LabReportOutputDto> {
    const labReport = await this.labReportRepository.findByReportId(reportId);
    if (!labReport) {
      throw new NotFoundException(`Lab report with report ID ${reportId} not found`);
    }
    return plainToClass(LabReportOutputDto, labReport.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Find all lab reports with filters
   */
  async findAll(filterDto: LabReportFilterDto): Promise<PaginatedLabReportsDto> {
    const result = await this.labReportRepository.findAll(filterDto);

    return plainToClass(
      PaginatedLabReportsDto,
      {
        data: result.data.map((doc) => doc.toObject()),
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        hasNextPage: result.page < result.totalPages,
        hasPreviousPage: result.page > 1,
      },
      { excludeExtraneousValues: true },
    );
  }

  /**
   * Find lab reports by patient ID
   */
  async findByPatientId(patientId: string): Promise<LabReportOutputDto[]> {
    const reports = await this.labReportRepository.findByPatientId(patientId);
    return reports.map((doc) =>
      plainToClass(LabReportOutputDto, doc.toObject(), { excludeExtraneousValues: true }),
    );
  }

  /**
   * Find lab reports by doctor ID
   */
  async findByDoctorId(doctorId: string): Promise<LabReportOutputDto[]> {
    const reports = await this.labReportRepository.findByDoctorId(doctorId);
    return reports.map((doc) =>
      plainToClass(LabReportOutputDto, doc.toObject(), { excludeExtraneousValues: true }),
    );
  }

  /**
   * Find lab reports by hospital ID
   */
  async findByHospitalId(hospitalId: string): Promise<LabReportOutputDto[]> {
    const reports = await this.labReportRepository.findByHospitalId(hospitalId);
    return reports.map((doc) =>
      plainToClass(LabReportOutputDto, doc.toObject(), { excludeExtraneousValues: true }),
    );
  }

  /**
   * Update lab report
   */
  async update(id: string, updateDto: UpdateLabReportDto): Promise<LabReportOutputDto> {
    const existingReport = await this.findById(id);

    // Check if status is changing to completed
    const wasNotCompleted = existingReport.status !== LabReportStatus.COMPLETED;
    const isNowCompleted = updateDto.status === LabReportStatus.COMPLETED;

    // Convert string IDs to ObjectIds
    const data: any = { ...updateDto };
    if (data.doctorId) {
      data.doctorId = new Types.ObjectId(data.doctorId);
    }
    if (data.hospitalId) {
      data.hospitalId = new Types.ObjectId(data.hospitalId);
    }
    if (data.labId) {
      data.labId = new Types.ObjectId(data.labId);
    }
    if (data.appointmentId) {
      data.appointmentId = new Types.ObjectId(data.appointmentId);
    }
    if (data.encounterId) {
      data.encounterId = new Types.ObjectId(data.encounterId);
    }

    const labReport = await this.labReportRepository.update(id, data);
    if (!labReport) {
      throw new NotFoundException(`Lab report with ID ${id} not found`);
    }

    // Check for critical results
    const hasCritical = labReport.results.some((r) => r.status === TestResultStatus.CRITICAL);
    if (hasCritical && !labReport.criticalNotificationSent) {
      await this.sendCriticalResultNotification(labReport);
    }

    // If report just became completed, send notifications
    if (wasNotCompleted && isNowCompleted) {
      await this.sendReportCompletedNotifications(labReport);
    }

    return plainToClass(LabReportOutputDto, labReport.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Soft delete lab report
   */
  async delete(id: string): Promise<void> {
    await this.findById(id); // Verify it exists
    await this.labReportRepository.softDelete(id);
    this.logger.log(`Lab report ${id} soft deleted`);
  }

  /**
   * Get lab report statistics
   */
  async getStatistics(filters?: Partial<LabReportFilterDto>) {
    return this.labReportRepository.getStatistics(filters);
  }

  /**
   * Get trend analysis for a specific test parameter
   */
  async getTrendAnalysis(
    patientId: string,
    parameterName: string,
    limit: number = 10,
  ): Promise<TrendAnalysisDto> {
    const data = await this.labReportRepository.getTrendAnalysis(patientId, parameterName, limit);

    if (data.length === 0) {
      return {
        parameterName,
        dataPoints: [],
        trend: 'stable' as const,
      };
    }

    // Calculate trend
    const numericValues = data
      .map((point) => {
        const value = parseFloat(point.value);
        return isNaN(value) ? null : value;
      })
      .filter((v) => v !== null) as number[];

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    let average: number | undefined;
    let min: number | undefined;
    let max: number | undefined;

    if (numericValues.length > 0) {
      average = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
      min = Math.min(...numericValues);
      max = Math.max(...numericValues);

      // Simple trend detection: compare first half with second half
      if (numericValues.length >= 4) {
        const midPoint = Math.floor(numericValues.length / 2);
        const firstHalfAvg = numericValues.slice(0, midPoint).reduce((a, b) => a + b, 0) / midPoint;
        const secondHalfAvg =
          numericValues.slice(midPoint).reduce((a, b) => a + b, 0) /
          (numericValues.length - midPoint);

        const change = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

        if (change > 10) {
          trend = 'increasing';
        } else if (change < -10) {
          trend = 'decreasing';
        }
      }
    }

    return {
      parameterName,
      dataPoints: data.map((point) => ({
        date: point.reportDate,
        value: point.value,
        status: point.status as any, // Cast to match TestResultStatus
        reportId: point.reportId,
        unit: point.unit,
        normalRange: point.normalRange,
      })),
      trend,
      average,
      min,
      max,
    };
  }

  /**
   * Get recent lab reports
   */
  async getRecentReports(limit: number = 10, hospitalId?: string): Promise<LabReportOutputDto[]> {
    const reports = await this.labReportRepository.getRecentReports(limit, hospitalId);
    return reports.map((doc) =>
      plainToClass(LabReportOutputDto, doc.toObject(), { excludeExtraneousValues: true }),
    );
  }

  /**
   * Process critical lab reports (run periodically)
   */
  async processCriticalReports(): Promise<void> {
    const criticalReports = await this.labReportRepository.findCriticalReports();

    for (const report of criticalReports) {
      await this.sendCriticalResultNotification(report);
    }

    this.logger.log(`Processed ${criticalReports.length} critical lab reports`);
  }

  /**
   * Send critical result notification
   */
  private async sendCriticalResultNotification(labReport: LabReportDocument): Promise<void> {
    try {
      const criticalParams = labReport.results
        .filter((r) => r.status === TestResultStatus.CRITICAL)
        .map((r) => r.parameterName)
        .join(', ');

      // Notify doctor (high priority)
      if (labReport.doctorId) {
        await this.notificationService.create({
          type: NotificationType.LAB_RESULT_CRITICAL,
          priority: NotificationPriority.CRITICAL,
          recipientId: labReport.doctorId.toString(),
          title: '🚨 Critical Lab Result Alert',
          message: `Patient ${labReport.patientId} has critical lab results: ${criticalParams}. Immediate action required.`,
          channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH, NotificationChannel.SMS],
          category: 'lab_results',
          relatedEntityId: labReport._id.toString(),
          actions: [
            {
              label: 'View Report',
              action: 'view_lab_report',
              data: { labReportId: labReport._id.toString() },
            },
          ],
          deepLink: `healthapp://lab-reports/${labReport._id}`,
          webLink: `/lab-reports/${labReport._id}`,
        });

        await this.labReportRepository.markDoctorNotified(labReport._id.toString());
      }

      // Notify patient (if applicable)
      await this.notificationService.create({
        type: NotificationType.LAB_RESULT_CRITICAL,
        priority: NotificationPriority.HIGH,
        recipientId: labReport.patientId,
        title: 'Important Lab Results',
        message: `Your recent lab test (${labReport.testName}) requires immediate medical attention. Please contact your doctor.`,
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
        category: 'lab_results',
        relatedEntityId: labReport._id.toString(),
      });

      await this.labReportRepository.markCriticalNotificationSent(labReport._id.toString());
      await this.labReportRepository.markPatientNotified(labReport._id.toString());

      this.logger.log(`Critical result notification sent for lab report ${labReport.reportId}`);
    } catch (error: any) {
      this.logger.error(`Failed to send critical result notification:`, error);
    }
  }

  /**
   * Send report completed notifications
   */
  private async sendReportCompletedNotifications(labReport: LabReportDocument): Promise<void> {
    try {
      // Notify patient
      if (!labReport.patientNotified) {
        await this.notificationService.create({
          type: NotificationType.LAB_RESULT_AVAILABLE,
          priority: NotificationPriority.NORMAL,
          recipientId: labReport.patientId,
          title: 'Lab Results Available',
          message: `Your ${labReport.testName} results are now available. ${labReport.results.some((r) => r.status !== TestResultStatus.NORMAL) ? 'Please review with your doctor.' : 'All results are within normal range.'}`,
          channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH, NotificationChannel.SMS],
          category: 'lab_results',
          relatedEntityId: labReport._id.toString(),
          actions: [
            {
              label: 'View Report',
              action: 'view_lab_report',
              data: { labReportId: labReport._id.toString() },
            },
          ],
          deepLink: `healthapp://lab-reports/${labReport._id}`,
          webLink: `/lab-reports/${labReport._id}`,
        });

        await this.labReportRepository.markPatientNotified(labReport._id.toString());
      }

      // Notify doctor
      if (labReport.doctorId && !labReport.doctorNotified) {
        await this.notificationService.create({
          type: NotificationType.LAB_RESULT_AVAILABLE,
          priority: NotificationPriority.NORMAL,
          recipientId: labReport.doctorId.toString(),
          title: 'Lab Results Ready for Review',
          message: `Lab results for patient ${labReport.patientId} (${labReport.testName}) are ready for your review.`,
          channels: [NotificationChannel.IN_APP],
          category: 'lab_results',
          relatedEntityId: labReport._id.toString(),
          actions: [
            {
              label: 'Review Results',
              action: 'view_lab_report',
              data: { labReportId: labReport._id.toString() },
            },
          ],
          deepLink: `healthapp://lab-reports/${labReport._id}`,
          webLink: `/lab-reports/${labReport._id}`,
        });

        await this.labReportRepository.markDoctorNotified(labReport._id.toString());
      }

      this.logger.log(`Report completed notifications sent for lab report ${labReport.reportId}`);
    } catch (error: any) {
      this.logger.error(`Failed to send report completed notifications:`, error);
    }
  }
}
