import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '../queue.module';
import {
  SyncBatchJob,
  ConflictResolutionJob,
  SyncRetryJob,
  OfflineSyncJob,
  DataValidationJob,
} from '../interfaces/sync-jobs.interface';

@Processor(QUEUE_NAMES.SYNC, {
  concurrency: parseInt(process.env.QUEUE_SYNC_CONCURRENCY || '2'),
  limiter: {
    max: 30,
    duration: 60000, // 30 jobs per minute
  },
})
@Injectable()
export class SyncProcessor extends WorkerHost {
  private readonly logger = new Logger(SyncProcessor.name);

  constructor(/* private readonly _configService: ConfigService */) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.log(`Processing ${job.name} job ${job.id}`);

    try {
      switch (job.name) {
        case 'sync-batch':
          return await this.handleSyncBatch(job.data as SyncBatchJob, job);

        case 'conflict-resolution':
          return await this.handleConflictResolution(job.data as ConflictResolutionJob, job);

        case 'sync-retry':
          return await this.handleSyncRetry(job.data as SyncRetryJob, job);

        case 'offline-sync':
          return await this.handleOfflineSync(job.data as OfflineSyncJob, job);

        case 'data-validation':
          return await this.handleDataValidation(job.data as DataValidationJob, job);

        default:
          throw new Error(`Unknown job type: ${job.name}`);
      }
    } catch (error) {
      this.logger.error(`Error processing ${job.name} job ${job.id}:`, error);
      throw error;
    }
  }

  /**
   * Process sync batch from offline client
   */
  private async handleSyncBatch(data: SyncBatchJob, job: Job) {
    this.logger.log(
      `Processing sync batch ${data.batchId} with ${data.operations.length} operations`,
    );

    const total = data.operations.length;
    const results = [];

    for (let i = 0; i < total; i++) {
      const operation = data.operations[i];

      try {
        if (!operation) continue;
        // Process each operation
        await this.processSyncOperation(operation, data.userId, data.deviceId);

        results.push({
          operationId: operation.id,
          success: true,
          entity: operation.entity,
          action: operation.action,
        });
      } catch (error) {
        if (!operation) continue;
        this.logger.error(`Failed to process operation ${operation.id}:`, error);

        // Check if this is a conflict
        if (error && typeof error === 'object' && 'code' in error && error.code === 'CONFLICT') {
          results.push({
            operationId: operation.id,
            success: false,
            conflict: true,
            serverVersion: (error as any).serverVersion,
            clientVersion: operation.clientVersion,
          });
        } else {
          const errorMessage =
            error && typeof error === 'object' && 'message' in error
              ? (error as any).message
              : 'Unknown error';
          results.push({
            operationId: operation.id,
            success: false,
            error: errorMessage,
          });
        }
      }

      // Update progress
      await job.updateProgress(Math.floor(((i + 1) / total) * 100));
    }

    const successful = results.filter((r) => r.success).length;
    const conflicts = results.filter((r) => r.conflict).length;
    const failed = results.filter((r) => !r.success && !r.conflict).length;

    return {
      batchId: data.batchId,
      total,
      successful,
      conflicts,
      failed,
      results,
      processedAt: new Date(),
    };
  }

  /**
   * Process individual sync operation
   */
  private async processSyncOperation(operation: any, _userId: string, _deviceId: string) {
    // TODO: Implement actual sync logic
    // - Validate operation data
    // - Check for conflicts (version mismatch)
    // - Apply operation to database
    // - Update sync timestamp

    this.logger.log(`Processing ${operation.action} on ${operation.entity}`);

    // Simulated conflict detection
    // if (Math.random() < 0.1) {
    //   throw { code: 'CONFLICT', serverVersion: 5, clientVersion: 3 };
    // }
  }

  /**
   * Resolve data conflict
   */
  private async handleConflictResolution(data: ConflictResolutionJob, job: Job) {
    this.logger.log(
      `Resolving conflict for ${data.entity} ${data.entityId} with strategy: ${data.strategy}`,
    );

    await job.updateProgress(20);

    let resolvedVersion: any;
    switch (data.strategy) {
      case 'client-wins':
        resolvedVersion = data.clientVersion;
        break;

      case 'server-wins':
        resolvedVersion = data.serverVersion;
        break;

      case 'merge':
        resolvedVersion = this.mergeVersions(data.clientVersion, data.serverVersion);
        break;

      case 'manual':
        // Queue for manual resolution
        this.logger.warn(`Conflict ${data.conflictId} requires manual resolution`);
        return {
          success: false,
          requiresManualResolution: true,
          conflictId: data.conflictId,
        };

      default:
        throw new Error(`Unknown conflict resolution strategy: ${data.strategy}`);
    }

    await job.updateProgress(70);

    // TODO: Apply resolved version to database
    // await this.repository.update(data.entityId, resolvedVersion);
    this.logger.debug(`Resolved version ready for ${data.entityId}`, { version: resolvedVersion });

    await job.updateProgress(100);

    return {
      success: true,
      conflictId: data.conflictId,
      strategy: data.strategy,
      resolvedAt: new Date(),
      resolvedVersion,
    };
  }

  /**
   * Merge conflicting versions
   */
  private mergeVersions(clientVersion: any, serverVersion: any): any {
    // TODO: Implement smart merge logic based on entity type
    // - For now, prefer server version with client's newer fields
    return {
      ...serverVersion,
      ...Object.keys(clientVersion).reduce(
        (acc: Record<string, any>, key: string) => {
          if (
            clientVersion[key] !== serverVersion[key] &&
            new Date(clientVersion.updatedAt) > new Date(serverVersion.updatedAt)
          ) {
            acc[key] = clientVersion[key];
          }
          return acc;
        },
        {} as Record<string, any>,
      ),
    };
  }

  /**
   * Retry failed sync operation
   */
  private async handleSyncRetry(data: SyncRetryJob, job: Job) {
    this.logger.log(`Retrying sync operation (attempt ${data.retryAttempt})`);

    await job.updateProgress(30);

    // TODO: Re-attempt the failed operation
    // - Fetch original operation data
    // - Apply with retry logic
    // - Update retry count

    await job.updateProgress(100);

    return {
      success: true,
      originalJobId: data.originalJobId,
      retryAttempt: data.retryAttempt,
      retriedAt: new Date(),
    };
  }

  /**
   * Process offline sync request
   */
  private async handleOfflineSync(data: OfflineSyncJob, job: Job) {
    this.logger.log(
      `Processing offline sync for user ${data.userId} since ${data.lastSyncTimestamp}`,
    );

    await job.updateProgress(20);

    // TODO: Fetch all changes since last sync
    // - Query database for changes after lastSyncTimestamp
    // - Filter by entity types
    // - Return changes to client

    const changes: any[] = [];
    // const changes = await this.fetchChangesSince(data.userId, data.lastSyncTimestamp, data.entities);

    await job.updateProgress(100);

    return {
      success: true,
      userId: data.userId,
      deviceId: data.deviceId,
      changesCount: changes.length,
      changes,
      syncedAt: new Date(),
    };
  }

  /**
   * Validate sync data
   */
  private async handleDataValidation(data: DataValidationJob, job: Job) {
    this.logger.log(`Validating data for batch ${data.batchId}`);

    const total = data.operations.length;
    const validationResults = [];

    for (let i = 0; i < total; i++) {
      const operation = data.operations[i];

      if (!operation) {
        validationResults.push({
          operationId: `unknown-${i}`,
          valid: false,
          errors: ['Operation is undefined'],
        });
        continue;
      }

      try {
        // TODO: Validate operation data against schema
        // - Check required fields
        // - Validate data types
        // - Check business rules

        validationResults.push({
          operationId: operation.id,
          valid: true,
        });
      } catch (error) {
        const err = error as Error;
        validationResults.push({
          operationId: operation.id,
          valid: false,
          errors: [err.message],
        });
      }

      await job.updateProgress(Math.floor(((i + 1) / total) * 100));
    }

    return {
      batchId: data.batchId,
      total,
      valid: validationResults.filter((r) => r.valid).length,
      invalid: validationResults.filter((r) => !r.valid).length,
      results: validationResults,
    };
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job, _result: any) {
    this.logger.log(`Sync job ${job.id} completed successfully`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Sync job ${job.id} failed:`, error.message);

    // For critical sync operations, may want to alert immediately
    if (job.data.priority === 'high') {
      this.logger.error(`HIGH PRIORITY sync job ${job.id} failed - immediate attention required`);
    }
  }
}
