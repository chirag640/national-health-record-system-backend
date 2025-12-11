import { IsOptional, IsString, MinLength, MaxLength, IsObject } from 'class-validator';
import sanitizeHtml from 'sanitize-html';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateEncounterDto {
  @ApiProperty({
    description: 'VisitReason',
    example: 'Sample text',
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
    return sanitizeHtml(trimmed, { allowedTags: [], allowedAttributes: {} });
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  visitReason?: string;

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
    if (value === 'null' || value === 'undefined' || value === '') {
      return undefined;
    }
    if (!value) {
      return value;
    }
    const trimmed = value.trim();
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
    description: 'vitals',
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
  vitals?: Record<string, any>;
}
