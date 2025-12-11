import {
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  IsUrl,
  IsObject,
  IsMongoId,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import sanitizeHtml from 'sanitize-html';

export class CreateHealthDocumentDto {
  @ApiProperty({
    description: 'Patient GUID reference',
    example: 'ABCD-1234-EFGH-5678',
    required: true,
  })
  @IsString()
  @MinLength(1)
  patientId!: string;

  @ApiProperty({
    description: 'Hospital ID reference',
    example: '507f1f77bcf86cd799439011',
    required: true,
  })
  @IsMongoId()
  hospitalId!: string;

  @ApiProperty({
    description: 'Encounter ID reference (optional, links document to specific visit)',
    example: '507f1f77bcf86cd799439011',
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  encounterId?: string;

  @ApiProperty({
    description: 'DocType',
    example: 'Sample text',
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
  docType!: string;

  @ApiProperty({
    description: 'URL address',
    example: 'https://example.com',
    required: true,
    maxLength: 2000,
  })
  @Transform(({ value }) => {
    if (!value) {
      return value;
    }
    const trimmed = value.trim();
    // Sanitize HTML to prevent XSS attacks
    return sanitizeHtml(trimmed, { allowedTags: [], allowedAttributes: {} });
  })
  @IsUrl()
  @MaxLength(2000)
  @IsUrl()
  fileUrl!: string;

  @ApiProperty({
    description: 'metadata',
    example: 'null',
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
  metadata?: Record<string, any>;
}
