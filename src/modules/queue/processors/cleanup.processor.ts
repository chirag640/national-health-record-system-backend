import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { readdir, stat, unlink } from 'fs/promises';
import { join } from 'path';
import { QUEUE_NAMES } from '../queue.module';
import {
  TempFileCleanupJob,
  OldJobCleanupJob,
  SessionCleanupJob,
  AuditLogCleanupJob,
  DatabaseCleanupJob,
  CacheCleanupJob,
  OrphanedRecordsJob,
} from '../interfaces/cleanup-jobs.interface';
import { S3LifecycleService } from '../../s3-lifecycle/s3-lifecycle.service';

@Processor(QUEUE_NAMES.CLEANUP, {
  concurrency: parseInt(process.env.QUEUE_CLEANUP_CONCURRENCY || '1'),
})
@Injectable()
export class CleanupProcessor extends WorkerHost {
  private readonly logger = new Logger(CleanupProcessor.name);

  constructor(
    /* private readonly _configService: ConfigService, */
    private readonly s3Service: S3LifecycleService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.log(`Processing ${job.name} job ${job.id}`);

    try {
      switch (job.name) {
        case 'temp-file-cleanup':
          return await this.handleTempFileCleanup(job.data as TempFileCleanupJob, job);

        case 'old-job-cleanup':
          return await this.handleOldJobCleanup(job.data as OldJobCleanupJob, job);

        case 'session-cleanup':
          return await this.handleSessionCleanup(job.data as SessionCleanupJob, job);

        case 'audit-log-cleanup':
          return await this.handleAuditLogCleanup(job.data as AuditLogCleanupJob, job);

        case 'database-cleanup':
          return await this.handleDatabaseCleanup(job.data as DatabaseCleanupJob, job);

        case 'cache-cleanup':
          return await this.handleCacheCleanup(job.data as CacheCleanupJob, job);

        case 'orphaned-records':
          return await this.handleOrphanedRecords(job.data as OrphanedRecordsJob, job);

        case 's3-temp-cleanup':
          return await this.handleS3TempCleanup(job.data as any, job);

        default:
          throw new Error(`Unknown job type: ${job.name}`);
      }
    } catch (error: any) {
      this.logger.error(`Error processing ${job.name} job ${job.id}:`, error);
      throw error;
    }
  }

  /**
   * Clean up temporary files
   */
  private async handleTempFileCleanup(data: TempFileCleanupJob, job: Job) {
    this.logger.log(`Cleaning temp files in ${data.directory} older than ${data.maxAge}ms`);

    await job.updateProgress(10);

    try {
      const files = await readdir(data.directory);
      const now = Date.now();
      let deletedCount = 0;
      let totalSize = 0;

      for (let i = 0; i < files.length; i++) {
        const fileName = files[i];
        if (!fileName) {
          continue;
        }
        const filePath = join(data.directory, fileName);

        try {
          const stats = await stat(filePath);
          const age = now - stats.mtimeMs;

          // Check if file matches pattern (if specified)
          if (data.pattern && fileName && !fileName.match(new RegExp(data.pattern))) {
            continue;
          }

          // Check if file is old enough
          if (age > data.maxAge) {
            if (!data.dryRun) {
              await unlink(filePath);
              deletedCount++;
              totalSize += stats.size;
            } else {
              this.logger.log(
                `[DRY RUN] Would delete: ${filePath} (${stats.size} bytes, ${Math.floor(age / 1000)}s old)`,
              );
            }
          }
        } catch (error: any) {
          const err = error as Error;
          this.logger.warn(`Failed to process file ${filePath}:`, err.message);
        }

        await job.updateProgress(Math.floor(((i + 1) / files.length) * 100));
      }

      return {
        directory: data.directory,
        filesDeleted: deletedCount,
        bytesFreed: totalSize,
        dryRun: data.dryRun || false,
        cleanedAt: new Date(),
      };
    } catch (error: any) {
      this.logger.error(`Failed to clean temp files in ${data.directory}:`, error);
      throw error;
    }
  }

  /**
   * Clean up old completed/failed jobs
   */
  private async handleOldJobCleanup(data: OldJobCleanupJob, job: Job) {
    this.logger.log(`Cleaning old ${data.status} jobs from ${data.queueName} queue`);

    await job.updateProgress(30);

    // TODO: Use BullMQ API to clean old jobs
    // const queue = new Queue(data.queueName);
    // const cutoffDate = Date.now() - (data.olderThan * 24 * 60 * 60 * 1000);
    //
    // await queue.clean(data.olderThan * 24 * 60 * 60 * 1000, 1000, data.status);

    await job.updateProgress(100);

    return {
      queueName: data.queueName,
      status: data.status,
      olderThan: data.olderThan,
      jobsDeleted: 0,
      cleanedAt: new Date(),
    };
  }

  /**
   * Clean up expired sessions
   */
  private async handleSessionCleanup(data: SessionCleanupJob, job: Job) {
    this.logger.log(`Cleaning expired sessions older than ${data.expiryThreshold}`);

    await job.updateProgress(20);

    // TODO: Delete expired sessions from database
    // const result = await this.sessionRepository.deleteMany({
    //   expiresAt: { $lt: data.expiryThreshold },
    //   limit: data.batchSize,
    // });

    await job.updateProgress(100);

    return {
      expiryThreshold: data.expiryThreshold,
      sessionsDeleted: 0,
      cleanedAt: new Date(),
    };
  }

  /**
   * Clean up old audit logs
   */
  private async handleAuditLogCleanup(data: AuditLogCleanupJob, job: Job) {
    this.logger.log(`Cleaning audit logs older than ${data.retentionDays} days`);

    await job.updateProgress(20);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - data.retentionDays);

    // TODO: Delete old audit logs
    // const result = await this.auditLogRepository.deleteMany({
    //   createdAt: { $lt: cutoffDate },
    //   limit: data.batchSize,
    // });

    await job.updateProgress(100);

    return {
      retentionDays: data.retentionDays,
      logsDeleted: 0,
      cleanedAt: new Date(),
    };
  }

  /**
   * Clean up database records
   */
  private async handleDatabaseCleanup(data: DatabaseCleanupJob, job: Job) {
    this.logger.log(`Cleaning ${data.table} with condition:`, data.condition);

    await job.updateProgress(30);

    // TODO: Delete records matching condition
    // const result = await this.databaseService.deleteMany(
    //   data.table,
    //   data.condition,
    //   data.limit,
    // );

    await job.updateProgress(100);

    return {
      table: data.table,
      condition: data.condition,
      recordsDeleted: 0,
      cleanedAt: new Date(),
    };
  }

  /**
   * Clean up cache entries
   */
  private async handleCacheCleanup(data: CacheCleanupJob, job: Job) {
    this.logger.log(`Cleaning cache entries matching pattern: ${data.pattern}`);

    await job.updateProgress(30);

    // TODO: Clear cache entries
    // if (data.maxAge) {
    //   await this.cacheManager.del(data.pattern);
    // } else {
    //   await this.cacheManager.reset();
    // }

    await job.updateProgress(100);

    return {
      pattern: data.pattern,
      entriesDeleted: 0,
      cleanedAt: new Date(),
    };
  }

  /**
   * Find and clean orphaned records
   */
  private async handleOrphanedRecords(data: OrphanedRecordsJob, job: Job) {
    this.logger.log(`Finding orphaned records for entity: ${data.entity}`);

    await job.updateProgress(20);

    // TODO: Find records that reference non-existent parent records
    // For example: Documents with workerId that doesn't exist
    //
    // const orphanedRecords = await this.repository.findOrphaned(
    //   data.entity,
    //   data.checkReferences,
    // );
    //
    // Delete or fix orphaned records

    await job.updateProgress(100);

    return {
      entity: data.entity,
      orphanedFound: 0,
      orphanedDeleted: 0,
      cleanedAt: new Date(),
    };
  }

  /**
   * Clean up S3 temporary files
   * Removes files in temp/ older than specified hours
   * Note: S3 lifecycle rules handle this automatically, but this provides manual control
   */
  private async handleS3TempCleanup(data: { olderThanHours?: number }, job: Job) {
    const olderThanHours = data.olderThanHours || 24;
    this.logger.log(`Cleaning S3 temp files older than ${olderThanHours} hours`);

    await job.updateProgress(30);

    try {
      const deletedCount = await this.s3Service.cleanupTempFiles(olderThanHours);

      await job.updateProgress(100);

      return {
        olderThanHours,
        filesDeleted: deletedCount,
        cleanedAt: new Date(),
      };
    } catch (error: any) {
      this.logger.error('Failed to cleanup S3 temp files:', error);
      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job, _result: any) {
    this.logger.log(`Cleanup job ${job.id} completed successfully`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Cleanup job ${job.id} failed:`, error.message);
  }
}
