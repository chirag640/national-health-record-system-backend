import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '../queue.module';
import { QueueConfigService } from '../queue.config';
import {
  TempFileCleanupJob,
  OldJobCleanupJob,
  SessionCleanupJob,
  AuditLogCleanupJob,
  DatabaseCleanupJob,
  CacheCleanupJob,
  OrphanedRecordsJob,
} from '../interfaces/cleanup-jobs.interface';

@Injectable()
export class CleanupProducer {
  private readonly logger = new Logger(CleanupProducer.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.CLEANUP) private readonly cleanupQueue: Queue,
    private readonly queueConfig: QueueConfigService,
  ) {}

  /**
   * Clean up temporary files
   */
  async cleanupTempFiles(data: TempFileCleanupJob) {
    const job = await this.cleanupQueue.add(
      'temp-file-cleanup',
      data,
      this.queueConfig.buildJobOptions(this.queueConfig.PRIORITY.LOW, 'background'),
    );

    this.logger.log(`Queued temp file cleanup job ${job.id}`);
    return job;
  }

  /**
   * Clean up old completed/failed jobs
   */
  async cleanupOldJobs(data: OldJobCleanupJob) {
    const job = await this.cleanupQueue.add(
      'old-job-cleanup',
      data,
      this.queueConfig.buildJobOptions(this.queueConfig.PRIORITY.LOW, 'background'),
    );

    this.logger.log(`Queued old job cleanup job ${job.id} for ${data.queueName}`);
    return job;
  }

  /**
   * Clean up expired sessions
   */
  async cleanupSessions(data: SessionCleanupJob) {
    const job = await this.cleanupQueue.add(
      'session-cleanup',
      data,
      this.queueConfig.buildJobOptions(this.queueConfig.PRIORITY.NORMAL, 'standard'),
    );

    this.logger.log(`Queued session cleanup job ${job.id}`);
    return job;
  }

  /**
   * Clean up old audit logs
   */
  async cleanupAuditLogs(data: AuditLogCleanupJob) {
    const job = await this.cleanupQueue.add(
      'audit-log-cleanup',
      data,
      this.queueConfig.buildJobOptions(this.queueConfig.PRIORITY.LOW, 'background'),
    );

    this.logger.log(`Queued audit log cleanup job ${job.id}`);
    return job;
  }

  /**
   * Clean up database records
   */
  async cleanupDatabase(data: DatabaseCleanupJob) {
    const job = await this.cleanupQueue.add(
      'database-cleanup',
      data,
      this.queueConfig.buildJobOptions(this.queueConfig.PRIORITY.NORMAL, 'standard'),
    );

    this.logger.log(`Queued database cleanup job ${job.id} for table ${data.table}`);
    return job;
  }

  /**
   * Clean up cache entries
   */
  async cleanupCache(data: CacheCleanupJob) {
    const job = await this.cleanupQueue.add(
      'cache-cleanup',
      data,
      this.queueConfig.buildJobOptions(this.queueConfig.PRIORITY.LOW, 'background'),
    );

    this.logger.log(`Queued cache cleanup job ${job.id}`);
    return job;
  }

  /**
   * Find and clean orphaned records
   */
  async cleanupOrphanedRecords(data: OrphanedRecordsJob) {
    const job = await this.cleanupQueue.add(
      'orphaned-records',
      data,
      this.queueConfig.buildJobOptions(this.queueConfig.PRIORITY.LOW, 'background'),
    );

    this.logger.log(`Queued orphaned records cleanup job ${job.id} for ${data.entity}`);
    return job;
  }

  /**
   * Clean up S3 temporary files
   * Note: S3 lifecycle rules handle this automatically, but this provides manual control
   */
  async cleanupS3TempFiles(olderThanHours: number = 24) {
    const job = await this.cleanupQueue.add(
      's3-temp-cleanup',
      { olderThanHours },
      this.queueConfig.buildJobOptions(this.queueConfig.PRIORITY.LOW, 'background'),
    );

    this.logger.log(`Queued S3 temp cleanup job ${job.id}`);
    return job;
  }

  /**
   * Schedule daily cleanup jobs
   */
  async scheduleDailyCleanup() {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Clean temp files older than 24 hours
    await this.cleanupTempFiles({
      directory: './uploads/temp',
      maxAge: oneDayAgo,
    });

    // Clean old completed jobs
    await this.cleanupOldJobs({
      queueName: 'notifications',
      status: 'completed',
      olderThan: 7,
    });

    // Clean expired sessions
    await this.cleanupSessions({
      expiryThreshold: thirtyDaysAgo,
      batchSize: 1000,
    });

    // Clean S3 temp files older than 24 hours
    await this.cleanupS3TempFiles(24);

    this.logger.log('Scheduled daily cleanup jobs');
  }

  /**
   * Get cleanup job status
   */
  async getJobStatus(jobId: string) {
    const job = await this.cleanupQueue.getJob(jobId);

    if (!job) {
      return null;
    }

    return {
      id: job.id,
      name: job.name,
      data: job.data,
      state: await job.getState(),
      returnvalue: job.returnvalue,
    };
  }
}
