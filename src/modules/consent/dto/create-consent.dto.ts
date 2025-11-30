import {
  IsOptional,
  IsArray,
  IsString,
  IsISO8601,
  IsMongoId,
  IsBoolean,
  MinLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConsentDto {
  @ApiProperty({
    description: 'Patient GUID reference',
    example: 'ABCD-1234-EFGH-5678',
    required: true,
  })
  @IsString()
  @MinLength(1)
  patientId!: string;

  @ApiProperty({
    description: 'Doctor ID reference (optional)',
    example: '507f1f77bcf86cd799439011',
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  doctorId?: string;

  @ApiProperty({
    description: 'Hospital ID reference (optional)',
    example: '507f1f77bcf86cd799439011',
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  hospitalId?: string;

  @ApiProperty({
    description: 'scope',
    example: 'null',
    required: true,
  })
  @IsArray()
  @IsString({ each: true })
  scope!: string[];

  @ApiProperty({
    description: 'expiresAt',
    example: 'null',
    required: true,
  })
  @Transform(({ value }) => {
    if (!value) return value;
    // Handle various date formats
    const date = new Date(value);
    if (isNaN(date.getTime())) return value; // Let validator handle invalid dates
    return date.toISOString(); // Normalize to ISO 8601
  })
  @IsISO8601({ strict: false })
  @Type(() => Date)
  expiresAt!: Date;

  @ApiProperty({
    description: 'Is consent active',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
