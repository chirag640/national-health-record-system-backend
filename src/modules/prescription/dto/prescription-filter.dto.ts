import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsMongoId, IsDateString, IsString, IsBoolean } from 'class-validator';
import { PrescriptionStatus, PrescriptionPriority } from '../schemas/prescription.schema';

export class PrescriptionFilterDto {
  @ApiPropertyOptional({ description: 'Filter by patient ID' })
  @IsMongoId()
  @IsOptional()
  patient?: string;

  @ApiPropertyOptional({ description: 'Filter by patient GUID' })
  @IsString()
  @IsOptional()
  patientGuid?: string;

  @ApiPropertyOptional({ description: 'Filter by prescriber (doctor) ID' })
  @IsMongoId()
  @IsOptional()
  prescriber?: string;

  @ApiPropertyOptional({ description: 'Filter by encounter ID' })
  @IsMongoId()
  @IsOptional()
  encounter?: string;

  @ApiPropertyOptional({ description: 'Filter by organization (hospital) ID' })
  @IsMongoId()
  @IsOptional()
  organization?: string;

  @ApiPropertyOptional({ enum: PrescriptionStatus, description: 'Filter by status' })
  @IsEnum(PrescriptionStatus)
  @IsOptional()
  status?: PrescriptionStatus;

  @ApiPropertyOptional({ enum: PrescriptionPriority, description: 'Filter by priority' })
  @IsEnum(PrescriptionPriority)
  @IsOptional()
  priority?: PrescriptionPriority;

  @ApiPropertyOptional({ description: 'Filter by medication name (partial match)' })
  @IsString()
  @IsOptional()
  medicationName?: string;

  @ApiPropertyOptional({ description: 'Start date for authored date range (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  authoredOnStart?: string;

  @ApiPropertyOptional({ description: 'End date for authored date range (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  authoredOnEnd?: string;

  @ApiPropertyOptional({ description: 'Filter controlled substances only' })
  @IsBoolean()
  @IsOptional()
  isControlledSubstance?: boolean;

  @ApiPropertyOptional({ description: 'Show only expired prescriptions' })
  @IsBoolean()
  @IsOptional()
  isExpired?: boolean;

  @ApiPropertyOptional({ description: 'Show only prescriptions with refills available' })
  @IsBoolean()
  @IsOptional()
  hasRefillsAvailable?: boolean;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Sort field', default: 'authoredOn' })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order (asc/desc)', default: 'desc' })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}
