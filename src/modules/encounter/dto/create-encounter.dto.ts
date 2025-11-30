import { IsOptional, IsString, MinLength, MaxLength, IsObject, IsMongoId } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import sanitizeHtml from 'sanitize-html';

export class CreateEncounterDto {
  @ApiProperty({
    description: 'Patient GUID reference',
    example: 'ABCD-1234-EFGH-5678',
    required: true,
  })
  @IsString()
  @MinLength(1)
  patientId!: string;

  @ApiProperty({
    description: 'Doctor ID reference',
    example: '507f1f77bcf86cd799439011',
    required: true,
  })
  @IsMongoId()
  doctorId!: string;

  @ApiProperty({
    description: 'Hospital ID reference',
    example: '507f1f77bcf86cd799439011',
    required: true,
  })
  @IsMongoId()
  hospitalId!: string;

  @ApiProperty({
    description: 'VisitReason',
    example: 'Sample text',
    required: true,
    minLength: 1,
    maxLength: 255,
  })
  @Transform(({ value }) => {
    if (!value) return value;
    const trimmed = value.trim();
    // Sanitize HTML to prevent XSS attacks
    return sanitizeHtml(trimmed, { allowedTags: [], allowedAttributes: {} });
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  visitReason!: string;

  @ApiProperty({
    description: 'Diagnosis',
    example: 'Sample text',
    required: false,
    minLength: 1,
    maxLength: 255,
  })
  @IsOptional()
  @Transform(({ value }) => {
    // Handle string "null" from frontend forms
    if (value === 'null' || value === 'undefined' || value === '') return undefined;
    if (!value) return value;
    const trimmed = value.trim();
    // Sanitize HTML to prevent XSS attacks
    return sanitizeHtml(trimmed, { allowedTags: [], allowedAttributes: {} });
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  diagnosis?: string;

  @ApiProperty({
    description: 'prescriptions',
    example: 'null',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    // Handle string "null" from frontend forms
    if (value === 'null' || value === 'undefined' || value === '') return undefined;
    if (!value) return value;
    return value;
  })
  @IsObject()
  prescriptions?: Record<string, any>;

  @ApiProperty({
    description: 'vitals',
    example: 'null',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    // Handle string "null" from frontend forms
    if (value === 'null' || value === 'undefined' || value === '') return undefined;
    if (!value) return value;
    return value;
  })
  @IsObject()
  vitals?: Record<string, any>;
}
