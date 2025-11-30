import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { S3LifecycleService } from './s3-lifecycle.service';
import { FileUploadController } from './file-upload.controller';
import { QueueModule } from '../queue/queue.module';

/**
 * S3 File Lifecycle Module
 *
 * Provides comprehensive file upload management with:
 * - Presigned URLs for direct S3 uploads
 * - Automatic temp-to-permanent migration
 * - Background processing queue integration
 * - File validation and security
 * - Version management
 * - Automatic cleanup via S3 lifecycle rules
 *
 * SETUP REQUIRED:
 * 1. Create S3 bucket
 * 2. Configure lifecycle rules (see S3_LIFECYCLE_RULES.md)
 * 3. Set environment variables:
 *    - AWS_REGION
 *    - AWS_ACCESS_KEY_ID
 *    - AWS_SECRET_ACCESS_KEY
 *    - S3_BUCKET_NAME
 * 4. Enable server-side encryption on bucket
 * 5. Configure CORS for direct uploads
 */
@Global()
@Module({
  imports: [ConfigModule, QueueModule],
  providers: [S3LifecycleService],
  controllers: [FileUploadController],
  exports: [S3LifecycleService],
})
export class S3LifecycleModule {}
