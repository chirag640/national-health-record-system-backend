import { Controller, Post, Get, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { S3LifecycleService } from './s3-lifecycle.service';
import {
  RequestPresignedUploadDto,
  CompleteUploadDto,
  DeleteFileDto,
} from './dtos/file-upload.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('File Upload (S3 Lifecycle)')
@Controller('files')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FileUploadController {
  constructor(private readonly s3Service: S3LifecycleService) {}

  /**
   * Request presigned upload URL
   * Client uploads directly to S3 using this URL
   */
  @Post('presign-upload')
  @ApiOperation({
    summary: 'Get presigned upload URL',
    description: 'Returns a presigned URL for direct S3 upload. File goes to temp/ first.',
  })
  @ApiResponse({ status: 201, description: 'Presigned URL generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file parameters' })
  async getPresignedUploadUrl(@Body() dto: RequestPresignedUploadDto) {
    return this.s3Service.getPresignedUploadUrl(
      dto.filename,
      dto.mimeType,
      dto.size,
      dto.entityId,
      dto.entityType,
      dto.metadata,
    );
  }

  /**
   * Complete upload
   * Moves file from temp/ to documents/ and queues background processing
   */
  @Post('complete-upload')
  @ApiOperation({
    summary: 'Complete file upload',
    description:
      'Finalizes upload by moving file from temp to permanent storage and queuing processing jobs',
  })
  @ApiResponse({ status: 200, description: 'Upload completed successfully' })
  @ApiResponse({ status: 400, description: 'File not found or invalid' })
  async completeUpload(@Body() dto: CompleteUploadDto) {
    const pathParts = dto.storagePath.split('/');
    const entityId = (pathParts.length > 2 ? pathParts[2] : 'unknown') as string;
    return this.s3Service.completeUpload(dto.storagePath, dto.fileId, entityId, dto.checksum);
  }

  /**
   * Request presigned download URL
   */
  @Get('presign-download/:fileId')
  @ApiOperation({
    summary: 'Get presigned download URL',
    description: 'Returns a presigned URL for secure file download',
  })
  @ApiResponse({ status: 200, description: 'Presigned download URL generated' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async getPresignedDownloadUrl(
    @Param('fileId') fileId: string,
    @Query('expiresIn') expiresIn?: number,
  ) {
    // In real implementation, fetch file metadata from database using fileId
    // For now, this is a simplified example
    const storagePath = `documents/worker/${fileId}`;
    const filename = 'file.pdf';

    return this.s3Service.getPresignedDownloadUrl(storagePath, filename, expiresIn || 300);
  }

  /**
   * Delete file
   */
  @Delete(':fileId')
  @ApiOperation({
    summary: 'Delete file',
    description: 'Permanently deletes file from S3',
  })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async deleteFile(@Param('fileId') fileId: string, @Body() dto: DeleteFileDto) {
    // In real implementation, fetch storagePath from database using fileId
    const storagePath = `documents/worker/${fileId}`;

    await this.s3Service.deleteFile(storagePath);

    return {
      message: 'File deleted successfully',
      fileId,
      reason: dto.reason,
    };
  }

  /**
   * List files by entity
   */
  @Get('entity/:entityType/:entityId')
  @ApiOperation({
    summary: 'List files by entity',
    description: 'Returns all files associated with an entity (worker, visit, etc)',
  })
  @ApiResponse({ status: 200, description: 'Files retrieved successfully' })
  async listFilesByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    const files = await this.s3Service.listFilesByEntity(entityType, entityId);

    return {
      entityType,
      entityId,
      files,
      count: files.length,
    };
  }

  /**
   * Manual temp file cleanup (for testing/admin)
   * In production, S3 lifecycle rules handle this automatically
   */
  @Post('cleanup-temp')
  @ApiOperation({
    summary: 'Cleanup temp files',
    description: 'Manually cleanup temp files older than specified hours (admin only)',
  })
  @ApiResponse({ status: 200, description: 'Cleanup completed' })
  async cleanupTempFiles(@Query('olderThanHours') olderThanHours?: number) {
    const deletedCount = await this.s3Service.cleanupTempFiles(olderThanHours || 24);

    return {
      message: 'Temp files cleaned up',
      deletedCount,
      olderThanHours: olderThanHours || 24,
    };
  }
}
