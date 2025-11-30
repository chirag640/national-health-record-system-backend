/**
 * File metadata interface for S3 uploaded files
 */
export interface FileMetadata {
  /** Unique file identifier */
  fileId: string;

  /** Original filename from client */
  originalName: string;

  /** Current storage path in S3 */
  storagePath: string;

  /** MIME type */
  mimeType: string;

  /** File size in bytes */
  size: number;

  /** SHA256 checksum for integrity verification */
  checksum?: string;

  /** File version number */
  version: number;

  /** Entity the file belongs to (workerId, userId, etc) */
  entityId: string;

  /** Entity type (worker, visit, document, etc) */
  entityType: string;

  /** Temporary storage path (before finalization) */
  tempPath?: string;

  /** Upload status */
  status: 'pending' | 'uploading' | 'completed' | 'failed' | 'archived';

  /** When upload was initiated */
  uploadedAt: Date;

  /** When file was finalized/moved to permanent storage */
  finalizedAt?: Date;

  /** Public URL expiration time (if presigned for download) */
  urlExpiresAt?: Date;

  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Presigned upload URL response
 */
export interface PresignedUploadResponse {
  /** Presigned URL for direct S3 upload */
  uploadUrl: string;

  /** Temporary storage path where file will be uploaded */
  storagePath: string;

  /** File identifier for tracking */
  fileId: string;

  /** URL expiration time */
  expiresIn: number;

  /** Required fields for upload */
  fields?: Record<string, string>;
}

/**
 * Presigned download URL response
 */
export interface PresignedDownloadResponse {
  /** Presigned URL for direct S3 download */
  downloadUrl: string;

  /** URL expiration time in seconds */
  expiresIn: number;

  /** Original filename for Content-Disposition header */
  filename: string;
}

/**
 * File upload completion result
 */
export interface UploadCompletionResult {
  /** File identifier */
  fileId: string;

  /** Final permanent storage path */
  storagePath: string;

  /** File metadata */
  metadata: FileMetadata;

  /** Whether background processing was queued */
  processingQueued: boolean;
}

/**
 * S3 bucket structure configuration
 */
export interface S3BucketStructure {
  /** Temporary upload prefix */
  tempPrefix: 'temp';

  /** Permanent documents prefix */
  documentsPrefix: 'documents';

  /** Archived files prefix */
  archivedPrefix: 'archived';

  /** Thumbnails prefix */
  thumbnailsPrefix: 'thumbnails';
}

/**
 * File validation rules
 */
export interface FileValidationRules {
  /** Maximum file size in bytes */
  maxSize: number;

  /** Allowed MIME types */
  allowedMimeTypes: string[];

  /** Allowed file extensions */
  allowedExtensions: string[];

  /** Require checksum verification */
  requireChecksum: boolean;

  /** Enable virus scanning */
  virusScanEnabled: boolean;
}
