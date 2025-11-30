import { IsString, IsNotEmpty, IsOptional, IsNumber, MaxLength, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for requesting a presigned upload URL
 */
export class RequestPresignedUploadDto {
  @ApiProperty({ description: 'Original filename', example: 'medical-report.pdf' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  filename!: string;

  @ApiProperty({ description: 'MIME type', example: 'application/pdf' })
  @IsString()
  @IsNotEmpty()
  mimeType!: string;

  @ApiProperty({ description: 'File size in bytes', example: 1048576 })
  @IsNumber()
  size!: number;

  @ApiProperty({
    description: 'Entity ID (workerId, visitId, etc)',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  entityId!: string;

  @ApiProperty({
    description: 'Entity type',
    example: 'worker',
    enum: ['worker', 'visit', 'document', 'user'],
  })
  @IsEnum(['worker', 'visit', 'document', 'user'])
  entityType!: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * DTO for completing an upload
 */
export class CompleteUploadDto {
  @ApiProperty({
    description: 'Temporary storage path from presigned URL response',
    example: 'temp/worker123/1234567890-file.pdf',
  })
  @IsString()
  @IsNotEmpty()
  storagePath!: string;

  @ApiProperty({
    description: 'File identifier from presigned URL response',
    example: 'file_abc123xyz',
  })
  @IsString()
  @IsNotEmpty()
  fileId!: string;

  @ApiPropertyOptional({
    description: 'Client-calculated checksum (SHA256)',
    example: 'a1b2c3d4...',
  })
  @IsString()
  @IsOptional()
  checksum?: string;

  @ApiPropertyOptional({ description: 'Actual file size uploaded', example: 1048576 })
  @IsNumber()
  @IsOptional()
  actualSize?: number;
}

/**
 * DTO for requesting a presigned download URL
 */
export class RequestPresignedDownloadDto {
  @ApiProperty({ description: 'File identifier or storage path', example: 'file_abc123xyz' })
  @IsString()
  @IsNotEmpty()
  fileId!: string;

  @ApiPropertyOptional({
    description: 'URL expiration time in seconds',
    example: 300,
    default: 300,
  })
  @IsNumber()
  @IsOptional()
  expiresIn?: number;
}

/**
 * DTO for file deletion
 */
export class DeleteFileDto {
  @ApiProperty({ description: 'File identifier to delete', example: 'file_abc123xyz' })
  @IsString()
  @IsNotEmpty()
  fileId!: string;

  @ApiPropertyOptional({
    description: 'Deletion reason',
    example: 'user_requested',
    enum: ['user_requested', 'duplicate', 'expired', 'invalid'],
  })
  @IsString()
  @IsOptional()
  reason?: string;
}

/**
 * DTO for file version management
 */
export class CreateFileVersionDto {
  @ApiProperty({ description: 'Original file ID to create version of', example: 'file_abc123xyz' })
  @IsString()
  @IsNotEmpty()
  originalFileId!: string;

  @ApiProperty({ description: 'New filename for version', example: 'medical-report-v2.pdf' })
  @IsString()
  @IsNotEmpty()
  filename!: string;

  @ApiProperty({ description: 'MIME type', example: 'application/pdf' })
  @IsString()
  @IsNotEmpty()
  mimeType!: string;

  @ApiProperty({ description: 'File size in bytes', example: 1048576 })
  @IsNumber()
  size!: number;

  @ApiPropertyOptional({ description: 'Version notes or changelog' })
  @IsString()
  @IsOptional()
  versionNotes?: string;
}
