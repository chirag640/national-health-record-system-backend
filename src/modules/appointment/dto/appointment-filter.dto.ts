import { IsEnum, IsOptional, IsDateString, IsString, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AppointmentStatus, AppointmentType } from '../schemas/appointment.schema';

export class AppointmentFilterDto {
  @ApiProperty({
    description: 'Filter by patient ID',
    example: 'NHRS-2025-A3B4C5D6',
    required: false,
  })
  @IsOptional()
  @IsString()
  patientId?: string;

  @ApiProperty({
    description: 'Filter by doctor ID',
    example: '507f1f77bcf86cd799439011',
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  doctorId?: string;

  @ApiProperty({
    description: 'Filter by hospital ID',
    example: '507f1f77bcf86cd799439011',
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  hospitalId?: string;

  @ApiProperty({
    description: 'Filter by status',
    enum: AppointmentStatus,
    example: AppointmentStatus.BOOKED,
    required: false,
  })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiProperty({
    description: 'Filter by appointment type',
    enum: AppointmentType,
    example: AppointmentType.CONSULTATION,
    required: false,
  })
  @IsOptional()
  @IsEnum(AppointmentType)
  appointmentType?: AppointmentType;

  @ApiProperty({
    description: 'Start date (ISO 8601)',
    example: '2025-12-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'End date (ISO 8601)',
    example: '2025-12-31',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: 'Page number',
    example: 1,
    required: false,
  })
  @IsOptional()
  page?: number;

  @ApiProperty({
    description: 'Items per page',
    example: 10,
    required: false,
  })
  @IsOptional()
  limit?: number;
}
