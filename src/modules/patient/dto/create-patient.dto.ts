import {
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsIn,
  IsISO8601,
  IsObject,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import sanitizeHtml from 'sanitize-html';

export class CreatePatientDto {
  @ApiProperty({
    description: 'Guid',
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
  guid!: string;

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
    description: 'gender',
    example: 'null',
    required: true,
  })
  @IsIn(['Male', 'Female', 'Other'])
  gender!: string;

  @ApiProperty({
    description: 'dateOfBirth',
    example: 'null',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    // Handle string "null" from frontend forms
    if (value === 'null' || value === 'undefined' || value === '') return undefined;
    if (!value) return value;
    // Handle various date formats
    const date = new Date(value);
    if (isNaN(date.getTime())) return value; // Let validator handle invalid dates
    return date.toISOString(); // Normalize to ISO 8601
  })
  @IsISO8601({ strict: false })
  @Type(() => Date)
  dateOfBirth?: Date;

  @ApiProperty({
    description: 'address',
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
  address?: Record<string, any>;

  @ApiProperty({
    description: 'allergies',
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
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @ApiProperty({
    description: 'chronicDiseases',
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
  @IsArray()
  @IsString({ each: true })
  chronicDiseases?: string[];

  @ApiProperty({
    description: 'BloodGroup',
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
  bloodGroup?: string;

  @ApiProperty({
    description: 'emergencyContact',
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
  emergencyContact?: Record<string, any>;

  @ApiProperty({
    description: 'HasSmartphone',
    example: true,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    // Handle string "null" from frontend forms
    if (value === 'null' || value === 'undefined' || value === '') return undefined;
    if (!value) return value;
    return value;
  })
  @IsBoolean()
  @IsBoolean()
  hasSmartphone?: boolean;

  @ApiProperty({
    description: 'Is idCardIssued',
    example: true,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    // Handle string "null" from frontend forms
    if (value === 'null' || value === 'undefined' || value === '') return undefined;
    if (!value) return value;
    return value;
  })
  @IsBoolean()
  @IsBoolean()
  idCardIssued?: boolean;
}
