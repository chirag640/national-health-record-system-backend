import {
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsMongoId,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import sanitizeHtml from 'sanitize-html';

export class CreateDoctorDto {
  @ApiProperty({
    description: 'Hospital ID reference',
    example: '507f1f77bcf86cd799439011',
    required: true,
  })
  @IsMongoId()
  hospitalId!: string;

  @ApiProperty({
    description: 'FullName',
    example: 'Sample Name',
    required: true,
    minLength: 2,
    maxLength: 50,
  })
  @Transform(({ value }) => {
    if (!value) return value;
    const trimmed = value.trim();
    // Sanitize HTML to prevent XSS attacks
    return sanitizeHtml(trimmed, { allowedTags: [], allowedAttributes: {} });
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  fullName!: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+1234567890',
    required: true,
    minLength: 10,
    maxLength: 20,
  })
  @Transform(({ value }) => {
    if (!value) return value;
    const trimmed = value.trim();
    // Sanitize HTML to prevent XSS attacks
    return sanitizeHtml(trimmed, { allowedTags: [], allowedAttributes: {} });
  })
  @IsString()
  @MinLength(10)
  @MaxLength(20)
  @Matches(/^[6-9]\d{9}$/)
  phone!: string;

  @ApiProperty({
    description: 'Specialization',
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
  specialization?: string;

  @ApiProperty({
    description: 'Medical License Number',
    example: 'MED-12345',
    required: false,
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'null' || value === 'undefined' || value === '') return undefined;
    if (!value) return value;
    const trimmed = value.trim();
    return sanitizeHtml(trimmed, { allowedTags: [], allowedAttributes: {} });
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  licenseNumber?: string;

  @ApiProperty({
    description: 'Is doctor active',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
