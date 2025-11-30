export interface SyncBatchJob {
  batchId: string;
  userId: string;
  deviceId: string;
  operations: Array<{
    id: string;
    entity: string;
    action: 'create' | 'update' | 'delete';
    data: any;
    timestamp: Date;
    clientVersion: number;
  }>;
  priority: 'high' | 'normal';
}

export interface ConflictResolutionJob {
  conflictId: string;
  entity: string;
  entityId: string;
  clientVersion: any;
  serverVersion: any;
  strategy: 'client-wins' | 'server-wins' | 'merge' | 'manual';
  userId: string;
}

export interface SyncRetryJob {
  originalJobId: string;
  retryAttempt: number;
  failureReason: string;
  data: any;
}

export interface OfflineSyncJob {
  userId: string;
  deviceId: string;
  lastSyncTimestamp: Date;
  entities: string[];
}

export interface DataValidationJob {
  batchId: string;
  operations: Array<{
    id: string;
    entity: string;
    data: any;
  }>;
}
