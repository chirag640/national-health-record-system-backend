import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsDateString, IsMongoId, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { TestCategory, LabReportStatus } from '../schemas/lab-report.schema';

/**
 * DTO for filtering/searching lab reports
 */
export class LabReportFilterDto {
  @ApiPropertyOptional({ description: 'Patient GUID', example: 'PAT-2024-001234' })
  @IsOptional()
  @IsString()
  patientId?: string;

  @ApiPropertyOptional({ description: 'Doctor ID' })
  @IsOptional()
  @IsMongoId()
  doctorId?: string;

  @ApiPropertyOptional({ description: 'Hospital/Lab ID' })
  @IsOptional()
  @IsMongoId()
  hospitalId?: string;

  @ApiPropertyOptional({ description: 'Appointment ID' })
  @IsOptional()
  @IsMongoId()
  appointmentId?: string;

  @ApiPropertyOptional({ description: 'Encounter ID' })
  @IsOptional()
  @IsMongoId()
  encounterId?: string;

  @ApiPropertyOptional({
    description: 'Filter by test category',
    enum: TestCategory,
  })
  @IsOptional()
  @IsEnum(TestCategory)
  testCategory?: TestCategory;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: LabReportStatus,
  })
  @IsOptional()
  @IsEnum(LabReportStatus)
  status?: LabReportStatus;

  @ApiPropertyOptional({ description: 'Search test name', example: 'CBC' })
  @IsOptional()
  @IsString()
  testName?: string;

  @ApiPropertyOptional({ description: 'Report ID', example: 'LAB-2024-001234' })
  @IsOptional()
  @IsString()
  reportId?: string;

  @ApiPropertyOptional({ description: 'Filter from date (ISO 8601)', example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Filter to date (ISO 8601)', example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ description: 'Filter by critical results', example: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  hasCriticalResults?: boolean;

  @ApiPropertyOptional({ description: 'Filter by abnormal results', example: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  hasAbnormalResults?: boolean;

  @ApiPropertyOptional({ description: 'Page number', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'reportDate',
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'desc',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}
