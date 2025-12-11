import { IsOptional, IsString, MinLength, MaxLength, IsObject, IsMongoId } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import sanitizeHtml from 'sanitize-html';

export class CreateEncounterDto {
  @ApiProperty({
    description: 'Patient unique identifier (NHRS format or MongoDB ID)',
    example: 'NHRS-2025-A3B4C5D6',
    required: true,
  })
  @IsString()
  @MinLength(1)
  patientId!: string;

  @ApiProperty({
    description: 'Attending doctor MongoDB ID',
    example: '507f1f77bcf86cd799439011',
    required: true,
  })
  @IsMongoId()
  doctorId!: string;

  @ApiProperty({
    description: 'Hospital/facility MongoDB ID where encounter occurred',
    example: '507f1f77bcf86cd799439011',
    required: true,
  })
  @IsMongoId()
  hospitalId!: string;

  @ApiProperty({
    description: 'Chief complaint or reason for visit',
    example: 'Persistent cough and fever for 3 days',
    required: true,
    minLength: 1,
    maxLength: 255,
  })
  @Transform(({ value }) => {
    if (!value) {
      return value;
    }
    const trimmed = value.trim();
    // Sanitize HTML to prevent XSS attacks
    return sanitizeHtml(trimmed, { allowedTags: [], allowedAttributes: {} });
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  visitReason!: string;

  @ApiProperty({
    description: 'Clinical diagnosis or assessment (optional, can be added after examination)',
    example: 'Acute upper respiratory tract infection',
    required: false,
    minLength: 1,
    maxLength: 255,
  })
  @IsOptional()
  @Transform(({ value }) => {
    // Handle string "null" from frontend forms
    if (value === 'null' || value === 'undefined' || value === '') {
      return undefined;
    }
    if (!value) {
      return value;
    }
    const trimmed = value.trim();
    // Sanitize HTML to prevent XSS attacks
    return sanitizeHtml(trimmed, { allowedTags: [], allowedAttributes: {} });
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  diagnosis?: string;

  @ApiProperty({
    description: 'Prescriptions issued during encounter (optional metadata)',
    example: { medications: ['Amoxicillin 500mg', 'Paracetamol 500mg'], count: 2 },
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    // Handle string "null" from frontend forms
    if (value === 'null' || value === 'undefined' || value === '') {
      return undefined;
    }
    if (!value) {
      return value;
    }
    return value;
  })
  @IsObject()
  prescriptions?: Record<string, any>;

  @ApiProperty({
    description: 'Vital signs recorded during encounter (optional metadata)',
    example: { temperature: '98.6°F', bloodPressure: '120/80', heartRate: 72 },
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    // Handle string "null" from frontend forms
    if (value === 'null' || value === 'undefined' || value === '') {
      return undefined;
    }
    if (!value) {
      return value;
    }
    return value;
  })
  @IsObject()
  vitals?: Record<string, any>;
}
