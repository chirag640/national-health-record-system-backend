import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '../queue.module';
import { QueueConfigService } from '../queue.config';
import {
  DocumentUploadJob,
  DocumentChecksumJob,
  DocumentVersioningJob,
  DocumentS3UploadJob,
  DocumentCleanupJob,
  DocumentThumbnailJob,
  DocumentOCRJob,
} from '../interfaces/document-jobs.interface';

@Injectable()
export class DocumentProducer {
  private readonly logger = new Logger(DocumentProducer.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.DOCUMENT) private readonly documentQueue: Queue,
    private readonly queueConfig: QueueConfigService,
  ) {}

  /**
   * Process uploaded document
   */
  async processUpload(data: DocumentUploadJob) {
    const job = await this.documentQueue.add(
      'document-upload',
      data,
      this.queueConfig.buildJobOptions(this.queueConfig.PRIORITY.HIGH, 'critical'),
    );

    this.logger.log(`Queued document upload job ${job.id} for file ${data.filename}`);
    return job;
  }

  /**
   * Generate document checksum
   */
  async generateChecksum(data: DocumentChecksumJob) {
    const job = await this.documentQueue.add(
      'document-checksum',
      data,
      this.queueConfig.buildJobOptions(this.queueConfig.PRIORITY.NORMAL, 'standard'),
    );

    this.logger.log(`Queued checksum job ${job.id} for file ${data.fileId}`);
    return job;
  }

  /**
   * Handle document versioning
   */
  async manageVersion(data: DocumentVersioningJob) {
    const job = await this.documentQueue.add(
      'document-versioning',
      data,
      this.queueConfig.buildJobOptions(this.queueConfig.PRIORITY.NORMAL, 'standard'),
    );

    this.logger.log(`Queued versioning job ${job.id} for document ${data.fileId}`);
    return job;
  }

  /**
   * Upload document to S3
   */
  async uploadToS3(data: DocumentS3UploadJob) {
    const job = await this.documentQueue.add(
      'document-s3-upload',
      data,
      this.queueConfig.buildJobOptions(this.queueConfig.PRIORITY.HIGH, 'critical'),
    );

    this.logger.log(`Queued S3 upload job ${job.id} for document ${data.fileId}`);
    return job;
  }

  /**
   * Clean up old or deleted documents
   */
  async cleanupDocument(data: DocumentCleanupJob) {
    const job = await this.documentQueue.add(
      'document-cleanup',
      data,
      this.queueConfig.buildJobOptions(this.queueConfig.PRIORITY.LOW, 'background'),
    );

    this.logger.log(`Queued cleanup job ${job.id} for document ${data.fileId}`);
    return job;
  }

  /**
   * Generate document thumbnail
   */
  async generateThumbnail(data: DocumentThumbnailJob) {
    const job = await this.documentQueue.add(
      'document-thumbnail',
      data,
      this.queueConfig.buildJobOptions(this.queueConfig.PRIORITY.NORMAL, 'standard'),
    );

    this.logger.log(`Queued thumbnail job ${job.id} for document ${data.fileId}`);
    return job;
  }

  /**
   * Perform OCR on document
   */
  async performOCR(data: DocumentOCRJob) {
    const job = await this.documentQueue.add(
      'document-ocr',
      data,
      this.queueConfig.buildJobOptions(this.queueConfig.PRIORITY.LOW, 'background'),
    );

    this.logger.log(`Queued OCR job ${job.id} for document ${data.fileId}`);
    return job;
  }

  /**
   * Get document job status
   */
  async getJobStatus(jobId: string) {
    const job = await this.documentQueue.getJob(jobId);

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
}
