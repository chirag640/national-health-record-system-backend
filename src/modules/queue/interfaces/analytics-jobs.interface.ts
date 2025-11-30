export interface WorkerStatsJob {
  type: 'daily' | 'weekly' | 'monthly';
  date: Date;
  aggregations: string[];
}

export interface VisitStatsJob {
  type: 'daily' | 'weekly' | 'monthly';
  date: Date;
  filters?: {
    providerId?: string;
    workerId?: string;
    dateRange?: { start: Date; end: Date };
  };
}

export interface DocumentUsageJob {
  type: 'storage' | 'access' | 'by-type';
  period: 'day' | 'week' | 'month';
  date: Date;
}

export interface UserActivityJob {
  userId: string;
  startDate: Date;
  endDate: Date;
  includeDetails: boolean;
}

export interface SystemHealthJob {
  metrics: string[];
  timestamp: Date;
}

export interface ReportGenerationJob {
  reportId: string;
  reportType: 'workers' | 'visits' | 'documents' | 'system' | 'custom';
  parameters: Record<string, any>;
  requestedBy: string;
  format: 'pdf' | 'csv' | 'excel' | 'json';
}
