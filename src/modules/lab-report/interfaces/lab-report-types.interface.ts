export interface LabReportStatistics {
  total: number;
  pending: number;
  collected: number;
  inProgress: number;
  completed: number;
  reviewed: number;
  cancelled: number;
  critical: number;
  abnormal: number;
  byCategory: Record<string, number>;
}

export interface LabReportTrendItem {
  reportId: string;
  reportDate: Date;
  parameterName: string;
  value: string;
  unit: string;
  status: string;
  normalRange: string;
}
