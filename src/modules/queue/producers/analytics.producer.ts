import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '../queue.module';
import { QueueConfigService } from '../queue.config';
import {
  WorkerStatsJob,
  VisitStatsJob,
  DocumentUsageJob,
  UserActivityJob,
  SystemHealthJob,
  ReportGenerationJob,
} from '../interfaces/analytics-jobs.interface';

@Injectable()
export class AnalyticsProducer {
  private readonly logger = new Logger(AnalyticsProducer.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.ANALYTICS) private readonly analyticsQueue: Queue,
    private readonly queueConfig: QueueConfigService,
  ) {}

  /**
   * Calculate worker statistics
   */
  async calculateWorkerStats(data: WorkerStatsJob) {
    const job = await this.analyticsQueue.add(
      'worker-stats',
      data,
      this.queueConfig.buildJobOptions(this.queueConfig.PRIORITY.LOW, 'background'),
    );

    this.logger.log(`Queued worker stats job ${job.id} for ${data.type} analytics`);
    return job;
  }

  /**
   * Calculate visit statistics
   */
  async calculateVisitStats(data: VisitStatsJob) {
    const job = await this.analyticsQueue.add(
      'visit-stats',
      data,
      this.queueConfig.buildJobOptions(this.queueConfig.PRIORITY.LOW, 'background'),
    );

    this.logger.log(`Queued visit stats job ${job.id} for ${data.type} analytics`);
    return job;
  }

  /**
   * Analyze document usage
   */
  async analyzeDocumentUsage(data: DocumentUsageJob) {
    const job = await this.analyticsQueue.add(
      'document-usage',
      data,
      this.queueConfig.buildJobOptions(this.queueConfig.PRIORITY.LOW, 'background'),
    );

    this.logger.log(`Queued document usage job ${job.id} for ${data.type} analysis`);
    return job;
  }

  /**
   * Track user activity
   */
  async trackUserActivity(data: UserActivityJob) {
    const job = await this.analyticsQueue.add(
      'user-activity',
      data,
      this.queueConfig.buildJobOptions(this.queueConfig.PRIORITY.NORMAL, 'standard'),
    );

    this.logger.log(`Queued user activity job ${job.id} for user ${data.userId}`);
    return job;
  }

  /**
   * Monitor system health
   */
  async monitorSystemHealth(data: SystemHealthJob) {
    const job = await this.analyticsQueue.add(
      'system-health',
      data,
      this.queueConfig.buildJobOptions(this.queueConfig.PRIORITY.NORMAL, 'standard'),
    );

    this.logger.log(`Queued system health job ${job.id}`);
    return job;
  }

  /**
   * Generate analytics report
   */
  async generateReport(data: ReportGenerationJob) {
    const job = await this.analyticsQueue.add(
      'report-generation',
      data,
      this.queueConfig.buildJobOptions(this.queueConfig.PRIORITY.NORMAL, 'background', undefined, {
        jobId: `report-${data.reportId}`,
      }),
    );

    this.logger.log(`Queued report generation job ${job.id} (${data.reportType})`);
    return job;
  }

  /**
   * Schedule daily analytics jobs
   */
  async scheduleDailyAnalytics() {
    const today = new Date();

    // Schedule worker stats
    await this.calculateWorkerStats({
      type: 'daily',
      date: today,
      aggregations: ['count', 'active', 'by_state'],
    });

    // Schedule visit stats
    await this.calculateVisitStats({
      type: 'daily',
      date: today,
    });

    // Schedule document usage
    await this.analyzeDocumentUsage({
      type: 'storage',
      period: 'day',
      date: today,
    });

    this.logger.log('Scheduled daily analytics jobs');
  }

  /**
   * Get analytics job status
   */
  async getJobStatus(jobId: string) {
    const job = await this.analyticsQueue.getJob(jobId);

    if (!job) {
      return null;
    }

    return {
      id: job.id,
      name: job.name,
      data: job.data,
      state: await job.getState(),
      progress: job.progress,
      returnvalue: job.returnvalue,
    };
  }
}
