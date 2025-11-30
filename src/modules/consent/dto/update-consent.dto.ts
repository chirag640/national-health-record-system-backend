import { IsOptional, IsArray, IsString, IsISO8601 } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateConsentDto {
  @ApiProperty({
    description: 'scope',
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
  scope?: string[];

  @ApiProperty({
    description: 'expiresAt',
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
  expiresAt?: Date;
}
