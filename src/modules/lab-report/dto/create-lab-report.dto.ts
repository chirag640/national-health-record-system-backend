import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
  IsDate,
  IsNumber,
  IsBoolean,
  IsMongoId,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TestCategory, LabReportStatus, TestResultStatus } from '../schemas/lab-report.schema';

/**
 * DTO for individual test parameter
 */
export class TestParameterDto {
  @ApiProperty({ description: 'Name of the test parameter', example: 'Hemoglobin' })
  @IsString()
  @MaxLength(200)
  parameterName!: string;

  @ApiProperty({ description: 'Test result value', example: '13.5' })
  @IsString()
  @MaxLength(100)
  value!: string;

  @ApiPropertyOptional({ description: 'Unit of measurement', example: 'g/dL' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  unit?: string;

  @ApiPropertyOptional({ description: 'Normal range for the parameter', example: '12-16 g/dL' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  normalRange?: string;

  @ApiProperty({
    description: 'Result status',
    enum: TestResultStatus,
    example: TestResultStatus.NORMAL,
  })
  @IsEnum(TestResultStatus)
  status!: TestResultStatus;

  @ApiPropertyOptional({ description: 'Additional remarks', example: 'Slightly elevated' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;

  @ApiPropertyOptional({ description: 'Testing methodology used', example: 'Automated analyzer' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  methodology?: string;
}

/**
 * DTO for creating a lab report
 */
export class CreateLabReportDto {
  @ApiProperty({ description: 'Patient GUID', example: 'PAT-2024-001234' })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  patientId!: string;

  @ApiPropertyOptional({ description: 'Doctor ID who ordered the test' })
  @IsOptional()
  @IsMongoId()
  doctorId?: string;

  @ApiProperty({ description: 'Hospital/Lab ID' })
  @IsMongoId()
  hospitalId!: string;

  @ApiPropertyOptional({ description: 'External lab ID if different from hospital' })
  @IsOptional()
  @IsMongoId()
  labId?: string;

  @ApiPropertyOptional({ description: 'Related appointment ID' })
  @IsOptional()
  @IsMongoId()
  appointmentId?: string;

  @ApiPropertyOptional({ description: 'Related encounter ID' })
  @IsOptional()
  @IsMongoId()
  encounterId?: string;

  @ApiProperty({
    description: 'Category of the test',
    enum: TestCategory,
    example: TestCategory.BLOOD,
  })
  @IsEnum(TestCategory)
  testCategory!: TestCategory;

  @ApiProperty({
    description: 'Name of the test',
    example: 'Complete Blood Count (CBC)',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  testName!: string;

  @ApiPropertyOptional({ description: 'Standard test code (LOINC/SNOMED)', example: '58410-2' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  testCode?: string;

  @ApiPropertyOptional({
    description: 'Panel codes for composite tests',
    example: ['58410-2', '718-7'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  testPanelCodes?: string[];

  @ApiProperty({ description: 'Date when test was ordered/collected' })
  @IsDate()
  @Type(() => Date)
  testDate!: Date;

  @ApiPropertyOptional({ description: 'Sample collection date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  sampleCollectionDate?: Date;

  @ApiPropertyOptional({ description: 'Report generation date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  reportDate?: Date;

  @ApiProperty({
    description: 'Report status',
    enum: LabReportStatus,
    example: LabReportStatus.PENDING,
  })
  @IsEnum(LabReportStatus)
  status!: LabReportStatus;

  @ApiProperty({
    description: 'Test results/parameters',
    type: [TestParameterDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestParameterDto)
  results!: TestParameterDto[];

  @ApiPropertyOptional({
    description: 'Clinical history/indication',
    example: 'Routine checkup',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  clinicalHistory?: string;

  @ApiPropertyOptional({
    description: 'Lab interpretation of results',
    example: 'All parameters within normal limits',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  interpretation?: string;

  @ApiPropertyOptional({
    description: 'Recommendations for follow-up',
    example: 'Repeat test in 3 months',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  recommendations?: string;

  @ApiPropertyOptional({
    description: 'Diagnostic impression',
    example: 'Normal complete blood count',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  diagnosticImpression?: string;

  @ApiPropertyOptional({
    description: 'Critical findings requiring immediate attention',
    example: ['Critically low platelet count'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  criticalFindings?: string[];

  @ApiPropertyOptional({
    description: 'Name of verifying lab technician/pathologist',
    example: 'Dr. John Smith',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  verifiedBy?: string;

  @ApiPropertyOptional({ description: 'License number of verifying personnel' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  verifiedByLicense?: string;

  @ApiPropertyOptional({ description: 'URL to PDF report' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  fileUrl?: string;

  @ApiPropertyOptional({ description: 'URLs to images (X-rays, scans)', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @ApiPropertyOptional({ description: 'Digital signature for authenticity' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  digitalSignature?: string;

  @ApiPropertyOptional({ description: 'Sample type', example: 'Blood' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sampleType?: string;

  @ApiPropertyOptional({ description: 'Sample barcode/identifier', example: 'SMP-2024-001234' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sampleId?: string;

  @ApiPropertyOptional({ description: 'Sample quality assessment', example: 'Adequate' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sampleQuality?: string;

  @ApiPropertyOptional({ description: 'Cost of the test', example: 500 })
  @IsOptional()
  @IsNumber()
  testCost?: number;

  @ApiPropertyOptional({ description: 'Payment status', example: false })
  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @ApiPropertyOptional({ description: 'Invoice ID if payment processed' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  invoiceId?: string;

  @ApiPropertyOptional({ description: 'Additional comments' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comments?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}
