import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { createHash } from 'crypto';
import { readFile, unlink, stat } from 'fs/promises';
import { QUEUE_NAMES } from '../queue.module';
import {
  DocumentUploadJob,
  DocumentChecksumJob,
  DocumentVersioningJob,
  DocumentS3UploadJob,
  DocumentCleanupJob,
  DocumentThumbnailJob,
  DocumentOCRJob,
} from '../interfaces/document-jobs.interface';

@Processor(QUEUE_NAMES.DOCUMENT, {
  concurrency: parseInt(process.env.QUEUE_DOCUMENT_CONCURRENCY || '3'),
  limiter: {
    max: 50,
    duration: 60000, // 50 jobs per minute
  },
})
@Injectable()
export class DocumentProcessor extends WorkerHost {
  private readonly logger = new Logger(DocumentProcessor.name);

  constructor(/* private readonly _configService: ConfigService */) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.log(`Processing ${job.name} job ${job.id}`);

    try {
      switch (job.name) {
        case 'document-upload':
          return await this.handleDocumentUpload(job.data as DocumentUploadJob, job);

        case 'document-checksum':
          return await this.handleDocumentChecksum(job.data as DocumentChecksumJob, job);

        case 'document-versioning':
          return await this.handleDocumentVersioning(job.data as DocumentVersioningJob, job);

        case 'document-s3-upload':
          return await this.handleS3Upload(job.data as DocumentS3UploadJob, job);

        case 'document-cleanup':
          return await this.handleDocumentCleanup(job.data as DocumentCleanupJob, job);

        case 'document-thumbnail':
          return await this.handleDocumentThumbnail(job.data as DocumentThumbnailJob, job);

        case 'document-ocr':
          return await this.handleDocumentOCR(job.data as DocumentOCRJob, job);

        default:
          throw new Error(`Unknown job type: ${job.name}`);
      }
    } catch (error: any) {
      this.logger.error(`Error processing ${job.name} job ${job.id}:`, error);
      throw error;
    }
  }

  /**
   * Process document upload
   */
  private async handleDocumentUpload(data: DocumentUploadJob, job: Job) {
    this.logger.log(`Processing upload for document ${data.fileId}`);

    await job.updateProgress(10);

    // Verify file exists
    try {
      const stats = await stat(data.filepath);

      await job.updateProgress(30);

      // Generate checksum
      const checksum = await this.generateChecksum(data.filepath, 'sha256');

      await job.updateProgress(60);

      // TODO: Store document metadata in database
      // await this.documentRepository.create({
      //   id: data.fileId,
      //   filename: data.filename,
      //   mimeType: data.mimeType,
      //   size: stats.size,
      //   checksum,
      //   uploaderId: data.uploaderId,
      //   workerId: data.workerId,
      //   metadata: data.metadata,
      // });

      await job.updateProgress(100);

      return {
        success: true,
        fileId: data.fileId,
        checksum,
        size: stats.size,
        processedAt: new Date(),
      };
    } catch (error: any) {
      this.logger.error(`Failed to process upload for ${data.fileId}:`, error);
      throw error;
    }
  }

  /**
   * Generate document checksum
   */
  private async handleDocumentChecksum(data: DocumentChecksumJob, job: Job) {
    this.logger.log(`Generating ${data.algorithm} checksum for ${data.fileId}`);

    await job.updateProgress(20);

    try {
      const checksum = await this.generateChecksum(data.filepath, data.algorithm);

      await job.updateProgress(80);

      // TODO: Update document record with checksum
      // await this.documentRepository.updateChecksum(data.fileId, checksum);

      await job.updateProgress(100);

      return {
        success: true,
        fileId: data.fileId,
        checksum,
        algorithm: data.algorithm,
      };
    } catch (error: any) {
      this.logger.error(`Failed to generate checksum for ${data.fileId}:`, error);
      throw error;
    }
  }

  /**
   * Handle document versioning
   */
  private async handleDocumentVersioning(data: DocumentVersioningJob, job: Job) {
    this.logger.log(`Managing version for document ${data.fileId} (${data.action})`);

    await job.updateProgress(30);

    // TODO: Implement versioning logic
    // - Create new version entry
    // - Copy file to versioned location
    // - Update document version number

    await job.updateProgress(100);

    return {
      success: true,
      fileId: data.fileId,
      action: data.action,
      versionedAt: new Date(),
    };
  }

  /**
   * Upload document to S3
   */
  private async handleS3Upload(data: DocumentS3UploadJob, job: Job) {
    this.logger.log(`Uploading document ${data.fileId} to S3 bucket ${data.bucket}`);

    await job.updateProgress(10);

    try {
      // TODO: Integrate with AWS S3 SDK
      // const s3 = new S3Client({ region: process.env.AWS_REGION });
      // const fileBuffer = await readFile(data.filepath);
      //
      // await s3.send(new PutObjectCommand({
      //   Bucket: data.bucket,
      //   Key: data.key,
      //   Body: fileBuffer,
      //   ContentType: mimeType,
      // }));

      await job.updateProgress(80);

      // Delete local file if requested
      if (data.deleteLocal) {
        await unlink(data.filepath);
        this.logger.log(`Deleted local file ${data.filepath}`);
      }

      await job.updateProgress(100);

      return {
        success: true,
        fileId: data.fileId,
        s3Key: data.key,
        bucket: data.bucket,
        uploadedAt: new Date(),
      };
    } catch (error: any) {
      this.logger.error(`Failed to upload ${data.fileId} to S3:`, error);
      throw error;
    }
  }

  /**
   * Clean up document
   */
  private async handleDocumentCleanup(data: DocumentCleanupJob, job: Job) {
    this.logger.log(`Cleaning up document ${data.fileId} (reason: ${data.reason})`);

    await job.updateProgress(30);

    try {
      // Delete physical file
      await unlink(data.filepath);

      await job.updateProgress(70);

      // TODO: Delete from database
      // await this.documentRepository.delete(data.fileId);

      await job.updateProgress(100);

      return {
        success: true,
        fileId: data.fileId,
        reason: data.reason,
        deletedAt: new Date(),
      };
    } catch (error: any) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
        // File already deleted
        this.logger.warn(`File ${data.filepath} already deleted`);
        return {
          success: true,
          fileId: data.fileId,
          alreadyDeleted: true,
        };
      }
      throw error;
    }
  }

  /**
   * Generate document thumbnail
   */
  private async handleDocumentThumbnail(data: DocumentThumbnailJob, job: Job) {
    this.logger.log(`Generating thumbnails for document ${data.fileId}`);

    await job.updateProgress(20);

    // TODO: Integrate with image processing library (Sharp, ImageMagick)
    // - Check if document is an image
    // - Generate thumbnails for each size
    // - Save thumbnails with naming convention

    await job.updateProgress(100);

    return {
      success: true,
      fileId: data.fileId,
      thumbnails: data.sizes.map((size) => ({
        width: size.width,
        height: size.height,
        path: `thumb_${size.width}x${size.height}_${data.fileId}`,
      })),
    };
  }

  /**
   * Perform OCR on document
   */
  private async handleDocumentOCR(data: DocumentOCRJob, job: Job) {
    this.logger.log(`Performing OCR on document ${data.fileId}`);

    await job.updateProgress(10);

    // TODO: Integrate with OCR service (Tesseract, Google Vision, AWS Textract)
    // - Extract text from document
    // - Store extracted text in database
    // - Enable full-text search

    await job.updateProgress(100);

    return {
      success: true,
      fileId: data.fileId,
      language: data.language,
      extractedText: 'Sample extracted text',
      ocrAt: new Date(),
    };
  }

  /**
   * Helper: Generate file checksum
   */
  private async generateChecksum(filepath: string, algorithm: 'sha256' | 'md5'): Promise<string> {
    const buffer = await readFile(filepath);
    const hash = createHash(algorithm);
    hash.update(buffer);
    return hash.digest('hex');
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job, _result: any) {
    this.logger.log(`Document job ${job.id} completed successfully`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Document job ${job.id} failed:`, error.message);
  }
}
