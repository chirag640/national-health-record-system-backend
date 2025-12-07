import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsDateString,
  Matches,
  MinLength,
  MaxLength,
  IsMongoId,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import sanitizeHtml from 'sanitize-html';
import { AppointmentType, AppointmentPriority } from '../schemas/appointment.schema';

export class CreateAppointmentDto {
  @ApiProperty({
    description: 'Patient GUID reference',
    example: 'NHRS-2025-A3B4C5D6',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  patientId!: string;

  @ApiProperty({
    description: 'Doctor ID reference',
    example: '507f1f77bcf86cd799439011',
    required: true,
  })
  @IsMongoId()
  @IsNotEmpty()
  doctorId!: string;

  @ApiProperty({
    description: 'Hospital ID reference',
    example: '507f1f77bcf86cd799439011',
    required: true,
  })
  @IsMongoId()
  @IsNotEmpty()
  hospitalId!: string;

  @ApiProperty({
    description: 'Type of appointment',
    enum: AppointmentType,
    example: AppointmentType.CONSULTATION,
    required: true,
  })
  @IsEnum(AppointmentType)
  @IsNotEmpty()
  appointmentType!: AppointmentType;

  @ApiProperty({
    description: 'Priority of appointment',
    enum: AppointmentPriority,
    example: AppointmentPriority.ROUTINE,
    required: false,
  })
  @IsOptional()
  @IsEnum(AppointmentPriority)
  priority?: AppointmentPriority;

  @ApiProperty({
    description: 'Appointment date (ISO 8601 format)',
    example: '2025-12-15',
    required: true,
  })
  @IsDateString()
  @IsNotEmpty()
  appointmentDate!: string;

  @ApiProperty({
    description: 'Start time (HH:mm format)',
    example: '10:00',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime must be in HH:mm format (e.g., 10:00)',
  })
  startTime!: string;

  @ApiProperty({
    description: 'End time (HH:mm format)',
    example: '10:30',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'endTime must be in HH:mm format (e.g., 10:30)',
  })
  endTime!: string;

  @ApiProperty({
    description: 'Reason for visit',
    example: 'Regular checkup and blood pressure monitoring',
    required: true,
    minLength: 5,
    maxLength: 500,
  })
  @Transform(({ value }) => {
    if (!value) return value;
    const trimmed = value.trim();
    return sanitizeHtml(trimmed, { allowedTags: [], allowedAttributes: {} });
  })
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  @IsNotEmpty()
  reasonForVisit!: string;

  @ApiProperty({
    description: 'Patient symptoms (optional)',
    example: 'Headache, fever, fatigue',
    required: false,
    maxLength: 1000,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return value;
    const trimmed = value.trim();
    return sanitizeHtml(trimmed, { allowedTags: [], allowedAttributes: {} });
  })
  @IsString()
  @MaxLength(1000)
  symptoms?: string;

  @ApiProperty({
    description: 'Additional notes',
    example: 'Patient prefers morning appointments',
    required: false,
    maxLength: 1000,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return value;
    const trimmed = value.trim();
    return sanitizeHtml(trimmed, { allowedTags: [], allowedAttributes: {} });
  })
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiProperty({
    description: 'Patient instructions (e.g., fasting required)',
    example: 'Please arrive 10 minutes early. Bring previous test reports.',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return value;
    const trimmed = value.trim();
    return sanitizeHtml(trimmed, { allowedTags: [], allowedAttributes: {} });
  })
  @IsString()
  @MaxLength(500)
  patientInstructions?: string;
}
