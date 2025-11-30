export interface TempFileCleanupJob {
  directory: string;
  maxAge: number; // in milliseconds
  pattern?: string;
  dryRun?: boolean;
}

export interface OldJobCleanupJob {
  queueName: string;
  status: 'completed' | 'failed';
  olderThan: number; // days
}

export interface SessionCleanupJob {
  expiryThreshold: Date;
  batchSize: number;
}

export interface AuditLogCleanupJob {
  retentionDays: number;
  batchSize: number;
}

export interface DatabaseCleanupJob {
  table: string;
  condition: Record<string, any>;
  limit: number;
}

export interface CacheCleanupJob {
  pattern: string;
  maxAge?: number;
}

export interface OrphanedRecordsJob {
  entity: string;
  checkReferences: string[];
}
