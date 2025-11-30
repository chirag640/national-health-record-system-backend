import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '../queue.module';
import { QueueConfigService } from '../queue.config';
import {
  SyncBatchJob,
  ConflictResolutionJob,
  SyncRetryJob,
  OfflineSyncJob,
  DataValidationJob,
} from '../interfaces/sync-jobs.interface';

@Injectable()
export class SyncProducer {
  private readonly logger = new Logger(SyncProducer.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.SYNC) private readonly syncQueue: Queue,
    private readonly queueConfig: QueueConfigService,
  ) {}

  /**
   * Process sync batch from offline client
   */
  async processSyncBatch(data: SyncBatchJob) {
    const priority = data.priority === 'high'
      ? this.queueConfig.PRIORITY.HIGH
      : this.queueConfig.PRIORITY.NORMAL;

    const job = await this.syncQueue.add(
      'sync-batch',
      data,
      this.queueConfig.buildJobOptions(priority, 'critical'),
    );

    this.logger.log(`Queued sync batch job ${job.id} with ${data.operations.length} operations`);
    return job;
  }

  /**
   * Resolve data conflict
   */
  async resolveConflict(data: ConflictResolutionJob) {
    const job = await this.syncQueue.add(
      'conflict-resolution',
      data,
      this.queueConfig.buildJobOptions(
        this.queueConfig.PRIORITY.HIGH,
        'critical',
      ),
    );

    this.logger.log(`Queued conflict resolution job ${job.id} for ${data.entity} ${data.entityId}`);
    return job;
  }

  /**
   * Retry failed sync operation
   */
  async retrySyncOperation(data: SyncRetryJob) {
    const job = await this.syncQueue.add(
      'sync-retry',
      data,
      this.queueConfig.buildJobOptions(
        this.queueConfig.PRIORITY.HIGH,
        'standard',
      ),
    );

    this.logger.log(`Queued sync retry job ${job.id} (attempt ${data.retryAttempt})`);
    return job;
  }

  /**
   * Process offline sync request
   */
  async processOfflineSync(data: OfflineSyncJob) {
    const job = await this.syncQueue.add(
      'offline-sync',
      data,
      this.queueConfig.buildJobOptions(
        this.queueConfig.PRIORITY.NORMAL,
        'standard',
      ),
    );

    this.logger.log(`Queued offline sync job ${job.id} for user ${data.userId}`);
    return job;
  }

  /**
   * Validate sync data
   */
  async validateData(data: DataValidationJob) {
    const job = await this.syncQueue.add(
      'data-validation',
      data,
      this.queueConfig.buildJobOptions(
        this.queueConfig.PRIORITY.NORMAL,
        'standard',
      ),
    );

    this.logger.log(`Queued data validation job ${job.id} for batch ${data.batchId}`);
    return job;
  }

  /**
   * Get sync job status
   */
  async getJobStatus(jobId: string) {
    const job = await this.syncQueue.getJob(jobId);
    
    if (!job) {
      return null;
    }

    return {
      id: job.id,
      name: job.name,
      data: job.data,
      state: await job.getState(),
      progress: job.progress,
      attemptsMade: job.attemptsMade,
      failedReason: job.failedReason,
    };
  }

  /**
   * Get pending sync operations for a user
   */
  async getPendingOperations(userId: string) {
    const jobs = await this.syncQueue.getJobs(['waiting', 'active', 'delayed']);
    
    return jobs.filter(job => 
      job.data.userId === userId || job.data.operations?.some((op: any) => op.userId === userId)
    );
  }
}
