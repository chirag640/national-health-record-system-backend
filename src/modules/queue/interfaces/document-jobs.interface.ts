export interface DocumentUploadJob {
  fileId: string;
  filename: string;
  filepath: string;
  mimeType: string;
  size: number;
  uploaderId: string;
  workerId?: string;
  metadata?: Record<string, any>;
}

export interface DocumentChecksumJob {
  fileId: string;
  filepath: string;
  algorithm: 'sha256' | 'md5';
}

export interface DocumentVersioningJob {
  fileId: string;
  previousVersion?: string;
  action: 'create' | 'update' | 'restore';
}

export interface DocumentS3UploadJob {
  fileId: string;
  filepath: string;
  filename: string;
  bucket: string;
  key: string;
  deleteLocal: boolean;
}

export interface DocumentCleanupJob {
  fileId: string;
  filepath: string;
  reason: 'expired' | 'deleted' | 'replaced';
}

export interface DocumentThumbnailJob {
  fileId: string;
  filepath: string;
  sizes: Array<{ width: number; height: number }>;
}

export interface DocumentOCRJob {
  fileId: string;
  filepath: string;
  language: string;
}
