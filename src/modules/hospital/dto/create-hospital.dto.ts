import { IsOptional, IsString, MinLength, MaxLength, IsIn, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import sanitizeHtml from 'sanitize-html';

export class CreateHospitalDto {
  @ApiProperty({
    description: 'Name',
    example: 'Sample Name',
    required: true,
    minLength: 2,
    maxLength: 50,
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
  @MinLength(2)
  @MaxLength(50)
  name!: string;

  @ApiProperty({
    description: 'State',
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
  state!: string;

  @ApiProperty({
    description: 'District',
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
  district!: string;

  @ApiProperty({
    description: 'hospitalType',
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
  @IsIn(['Government', 'Private'])
  hospitalType?: string;

  @ApiProperty({
    description: 'IsActive',
    example: true,
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
  @IsBoolean()
  @IsBoolean()
  isActive?: boolean;
}
