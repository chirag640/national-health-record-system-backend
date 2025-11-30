import { IsOptional, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import sanitizeHtml from 'sanitize-html';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateDoctorDto {
  @ApiProperty({
    description: 'FullName',
    example: 'Sample Name',
    required: false,
    minLength: 2,
    maxLength: 50,
  })
  @IsOptional()
  @Transform(({ value }) => {
    // Handle string "null" from frontend forms
    if (value === 'null' || value === 'undefined' || value === '') return undefined;
    if (!value) return value;
    const trimmed = value.trim();
    return sanitizeHtml(trimmed, { allowedTags: [], allowedAttributes: {} });
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  fullName?: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+1234567890',
    required: false,
    minLength: 10,
    maxLength: 20,
  })
  @IsOptional()
  @Transform(({ value }) => {
    // Handle string "null" from frontend forms
    if (value === 'null' || value === 'undefined' || value === '') return undefined;
    if (!value) return value;
    const trimmed = value.trim();
    return sanitizeHtml(trimmed, { allowedTags: [], allowedAttributes: {} });
  })
  @IsString()
  @MinLength(10)
  @MaxLength(20)
  @Matches(/^[6-9]\d{9}$/)
  phone?: string;

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
    return sanitizeHtml(trimmed, { allowedTags: [], allowedAttributes: {} });
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  specialization?: string;
}
