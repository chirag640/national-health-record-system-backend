import { IsString, IsNotEmpty, IsMongoId, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EmergencyConsentOverrideDto {
  @ApiProperty({
    description: 'Patient ID for emergency access',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  @IsNotEmpty()
  patientId!: string;

  @ApiProperty({
    description: 'Doctor ID requesting emergency access',
    example: '507f1f77bcf86cd799439012',
  })
  @IsMongoId()
  @IsNotEmpty()
  doctorId!: string;

  @ApiProperty({
    description: 'Hospital admin ID approving the emergency access',
    example: '507f1f77bcf86cd799439013',
  })
  @IsMongoId()
  @IsNotEmpty()
  adminId!: string;

  @ApiProperty({
    description: 'Medical justification for emergency access (minimum 20 characters)',
    example:
      'Patient brought unconscious to ER. Requires immediate medical history for life-saving treatment.',
    minLength: 20,
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(20, { message: 'Justification must be at least 20 characters' })
  @MaxLength(500, { message: 'Justification cannot exceed 500 characters' })
  justification!: string;

  @ApiProperty({
    description: 'OTP sent to hospital admin for verification',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(6)
  otp!: string;
}
