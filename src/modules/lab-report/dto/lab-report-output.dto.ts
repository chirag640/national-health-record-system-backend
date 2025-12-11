import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TestCategory, LabReportStatus, TestResultStatus } from '../schemas/lab-report.schema';

/**
 * Output DTO for test parameter
 */
export class TestParameterOutputDto {
  @ApiProperty({ description: 'Parameter name', example: 'Hemoglobin' })
  parameterName!: string;

  @ApiProperty({ description: 'Test result value', example: '13.5' })
  value!: string;

  @ApiPropertyOptional({ description: 'Unit of measurement', example: 'g/dL' })
  unit?: string;

  @ApiPropertyOptional({ description: 'Normal range', example: '12-16 g/dL' })
  normalRange?: string;

  @ApiProperty({ description: 'Result status', enum: TestResultStatus })
  status!: TestResultStatus;

  @ApiPropertyOptional({ description: 'Remarks' })
  remarks?: string;

  @ApiPropertyOptional({ description: 'Testing methodology' })
  methodology?: string;
}

/**
 * Output DTO for lab report
 */
export class LabReportOutputDto {
  @ApiProperty({ description: 'MongoDB ID' })
  _id!: string;

  @ApiProperty({ description: 'Report ID', example: 'LAB-2024-001234' })
  reportId!: string;

  @ApiProperty({ description: 'Patient GUID' })
  patientId!: string;

  @ApiPropertyOptional({ description: 'Doctor ID' })
  doctorId?: string;

  @ApiProperty({ description: 'Hospital ID' })
  hospitalId!: string;

  @ApiPropertyOptional({ description: 'Lab ID' })
  labId?: string;

  @ApiPropertyOptional({ description: 'Appointment ID' })
  appointmentId?: string;

  @ApiPropertyOptional({ description: 'Encounter ID' })
  encounterId?: string;

  @ApiProperty({ description: 'Test category', enum: TestCategory })
  testCategory!: TestCategory;

  @ApiProperty({ description: 'Test name' })
  testName!: string;

  @ApiPropertyOptional({ description: 'Test code' })
  testCode?: string;

  @ApiPropertyOptional({ description: 'Panel codes' })
  testPanelCodes?: string[];

  @ApiProperty({ description: 'Test date' })
  testDate!: Date;

  @ApiPropertyOptional({ description: 'Sample collection date' })
  sampleCollectionDate?: Date;

  @ApiPropertyOptional({ description: 'Report date' })
  reportDate?: Date;

  @ApiPropertyOptional({ description: 'Reviewed date' })
  reviewedDate?: Date;

  @ApiProperty({ description: 'Report status', enum: LabReportStatus })
  status!: LabReportStatus;

  @ApiProperty({ description: 'Test results', type: [TestParameterOutputDto] })
  results!: TestParameterOutputDto[];

  @ApiPropertyOptional({ description: 'Clinical history' })
  clinicalHistory?: string;

  @ApiPropertyOptional({ description: 'Interpretation' })
  interpretation?: string;

  @ApiPropertyOptional({ description: 'Recommendations' })
  recommendations?: string;

  @ApiPropertyOptional({ description: 'Diagnostic impression' })
  diagnosticImpression?: string;

  @ApiPropertyOptional({ description: 'Critical findings' })
  criticalFindings?: string[];

  @ApiPropertyOptional({ description: 'Verified by' })
  verifiedBy?: string;

  @ApiPropertyOptional({ description: 'Verifier license' })
  verifiedByLicense?: string;

  @ApiPropertyOptional({ description: 'Reviewed by' })
  reviewedBy?: string;

  @ApiPropertyOptional({ description: 'File URL' })
  fileUrl?: string;

  @ApiPropertyOptional({ description: 'Image URLs' })
  imageUrls?: string[];

  @ApiPropertyOptional({ description: 'Digital signature' })
  digitalSignature?: string;

  @ApiPropertyOptional({ description: 'Sample type' })
  sampleType?: string;

  @ApiPropertyOptional({ description: 'Sample ID' })
  sampleId?: string;

  @ApiPropertyOptional({ description: 'Sample quality' })
  sampleQuality?: string;

  @ApiPropertyOptional({ description: 'Test cost' })
  testCost?: number;

  @ApiProperty({ description: 'Payment status' })
  isPaid!: boolean;

  @ApiPropertyOptional({ description: 'Invoice ID' })
  invoiceId?: string;

  @ApiPropertyOptional({ description: 'Comments' })
  comments?: string;

  @ApiPropertyOptional({ description: 'Metadata' })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Critical notification sent' })
  criticalNotificationSent!: boolean;

  @ApiProperty({ description: 'Patient notified' })
  patientNotified!: boolean;

  @ApiProperty({ description: 'Doctor notified' })
  doctorNotified!: boolean;

  @ApiProperty({ description: 'Has critical results' })
  hasCriticalResults!: boolean;

  @ApiProperty({ description: 'Has abnormal results' })
  hasAbnormalResults!: boolean;

  @ApiProperty({ description: 'Created at' })
  createdAt!: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt!: Date;

  @ApiPropertyOptional({ description: 'Deleted at' })
  deletedAt?: Date;
}

/**
 * Output DTO for paginated lab reports
 */
export class PaginatedLabReportsDto {
  @ApiProperty({ description: 'Lab reports', type: [LabReportOutputDto] })
  data!: LabReportOutputDto[];

  @ApiProperty({ description: 'Total count' })
  total!: number;

  @ApiProperty({ description: 'Current page' })
  page!: number;

  @ApiProperty({ description: 'Items per page' })
  limit!: number;

  @ApiProperty({ description: 'Total pages' })
  totalPages!: number;

  @ApiProperty({ description: 'Has next page' })
  hasNextPage!: boolean;

  @ApiProperty({ description: 'Has previous page' })
  hasPreviousPage!: boolean;
}

/**
 * Output DTO for lab report statistics
 */
export class LabReportStatsDto {
  @ApiProperty({ description: 'Total reports' })
  total!: number;

  @ApiProperty({ description: 'Pending reports' })
  pending!: number;

  @ApiProperty({ description: 'In progress reports' })
  inProgress!: number;

  @ApiProperty({ description: 'Completed reports' })
  completed!: number;

  @ApiProperty({ description: 'Reports with critical results' })
  critical!: number;

  @ApiProperty({ description: 'Reports with abnormal results' })
  abnormal!: number;

  @ApiProperty({ description: 'Reports by category' })
  byCategory!: Record<string, number>;
}

/**
 * Output DTO for trend analysis
 */
export class TrendAnalysisDto {
  @ApiProperty({ description: 'Parameter name' })
  parameterName!: string;

  @ApiProperty({ description: 'Historical data points' })
  dataPoints!: Array<{
    date: Date;
    value: string;
    status: TestResultStatus;
    reportId: string;
  }>;

  @ApiProperty({ description: 'Trend direction', example: 'increasing' })
  trend?: 'increasing' | 'decreasing' | 'stable';

  @ApiProperty({ description: 'Average value' })
  average?: number;

  @ApiProperty({ description: 'Minimum value' })
  min?: number;

  @ApiProperty({ description: 'Maximum value' })
  max?: number;
}
