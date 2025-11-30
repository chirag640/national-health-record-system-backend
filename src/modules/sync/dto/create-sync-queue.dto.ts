import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsObject,
  IsOptional,
  IsDateString,
  IsNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSyncQueueDto {
  @ApiProperty({
    description: 'User ID performing the operation',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({
    description: 'Unique device identifier',
    example: 'device-123-abc-456',
  })
  @IsString()
  @IsNotEmpty()
  deviceId!: string;

  @ApiProperty({
    description: 'Operation type',
    enum: ['CREATE', 'UPDATE', 'DELETE'],
    example: 'CREATE',
  })
  @IsEnum(['CREATE', 'UPDATE', 'DELETE'])
  @IsNotEmpty()
  operation!: string;

  @ApiProperty({
    description: 'Resource type being modified',
    enum: ['patient', 'doctor', 'encounter', 'consent', 'health-document'],
    example: 'encounter',
  })
  @IsEnum(['patient', 'doctor', 'encounter', 'consent', 'health-document'])
  @IsNotEmpty()
  resourceType!: string;

  @ApiProperty({
    description: 'Resource ID (optional for CREATE operations)',
    example: '507f1f77bcf86cd799439020',
    required: false,
  })
  @IsString()
  @IsOptional()
  resourceId?: string;

  @ApiProperty({
    description: 'Data payload for the operation',
    example: {
      patientId: '507f1f77bcf86cd799439011',
      diagnosis: 'Common cold',
      prescription: 'Rest and fluids',
    },
  })
  @IsObject()
  @IsNotEmpty()
  data!: Record<string, any>;

  @ApiProperty({
    description: 'Client-side timestamp when operation was performed',
    example: '2025-11-30T10:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  createdAtClient!: Date;

  @ApiProperty({
    description: 'Data version for conflict detection',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  version?: number;
}
