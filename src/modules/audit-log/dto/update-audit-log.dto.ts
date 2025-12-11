import { IsOptional, IsString, MinLength, MaxLength, IsObject } from 'class-validator';
import sanitizeHtml from 'sanitize-html';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAuditLogDto {
  @ApiProperty({
    description: 'UserId',
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
  userId?: string;

  @ApiProperty({
    description: 'Action',
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
  action?: string;

  @ApiProperty({
    description: 'Resource',
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
  resource?: string;

  @ApiProperty({
    description: 'ResourceId',
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
  resourceId?: string;

  @ApiProperty({
    description: 'Physical address',
    example: '123 Main St, City, State 12345',
    required: false,
    minLength: 5,
    maxLength: 500,
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
  @MinLength(5)
  @MaxLength(500)
  ipAddress?: string;

  @ApiProperty({
    description: 'details',
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
  details?: Record<string, any>;
}
