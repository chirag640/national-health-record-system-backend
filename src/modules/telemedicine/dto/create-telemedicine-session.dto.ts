import {
  IsString,
  IsEnum,
  IsDate,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  Max,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SessionType, ParticipantRole } from '../schemas/telemedicine-session.schema';

export class CreateParticipantDto {
  @ApiProperty({
    description: 'User ID of the participant (patient, doctor, or specialist)',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  userId!: string;

  @ApiProperty({
    description: 'Role of the participant in the session',
    enum: ParticipantRole,
    example: ParticipantRole.DOCTOR,
  })
  @IsEnum(ParticipantRole)
  role!: ParticipantRole;
}

export class VideoRoomConfigDto {
  @ApiPropertyOptional({
    description: 'Maximum number of participants allowed in the session',
    example: 5,
    minimum: 2,
    maximum: 10,
    default: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(2)
  @Max(10)
  maxParticipants?: number;

  @ApiPropertyOptional({
    description: 'Enable video streaming for participants',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  enableVideo?: boolean;

  @ApiPropertyOptional({
    description: 'Enable audio for participants',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  enableAudio?: boolean;

  @ApiPropertyOptional({
    description: 'Enable screen sharing capability',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  enableScreenShare?: boolean;

  @ApiPropertyOptional({
    description: 'Enable session recording',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  enableRecording?: boolean;

  @ApiPropertyOptional({
    description: 'Maximum session duration in minutes',
    example: 30,
    minimum: 5,
    maximum: 240,
    default: 60,
  })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(240)
  maxDuration?: number; // in minutes

  @ApiPropertyOptional({
    description: 'Type of video room configuration',
    example: 'peer-to-peer',
    enum: ['group', 'peer-to-peer', 'group-small'],
    default: 'peer-to-peer',
  })
  @IsOptional()
  @IsString()
  roomType?: string; // 'group' | 'peer-to-peer' | 'group-small'
}

export class CreateTelemedicineSessionDto {
  @ApiProperty({
    description: 'Type of telemedicine session',
    enum: SessionType,
    example: SessionType.VIDEO,
  })
  @IsEnum(SessionType)
  sessionType!: SessionType;

  @ApiProperty({
    description: 'Patient ID participating in the session',
    example: 'NHRS-2025-A3B4C5D6',
  })
  @IsString()
  patientId!: string;

  @ApiProperty({
    description: 'Doctor ID conducting the session',
    example: '507f1f77bcf86cd799439012',
  })
  @IsString()
  doctorId!: string;

  @ApiPropertyOptional({
    description: 'Hospital ID where the session is being conducted',
    example: '507f1f77bcf86cd799439013',
  })
  @IsOptional()
  @IsString()
  hospitalId?: string;

  @ApiPropertyOptional({
    description: 'Related appointment ID if this session is linked to an appointment',
    example: '507f1f77bcf86cd799439014',
  })
  @IsOptional()
  @IsString()
  appointmentId?: string;

  @ApiProperty({
    description: 'Scheduled start time for the telemedicine session',
    example: '2025-12-15T10:00:00.000Z',
    type: Date,
  })
  @IsDate()
  @Type(() => Date)
  scheduledStartTime!: Date;

  @ApiProperty({
    description: 'Scheduled end time for the telemedicine session',
    example: '2025-12-15T10:30:00.000Z',
    type: Date,
  })
  @IsDate()
  @Type(() => Date)
  scheduledEndTime!: Date;

  @ApiProperty({
    description: 'Title or subject of the consultation',
    example: 'Follow-up consultation for diabetes management',
  })
  @IsString()
  title!: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the consultation purpose',
    example: 'Review recent blood sugar readings and adjust medication dosage',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: "Patient's chief complaint or primary concern",
    example: 'Persistent headaches and dizziness',
  })
  @IsOptional()
  @IsString()
  chiefComplaint?: string;

  @ApiPropertyOptional({
    description: 'Additional participants like specialists or family members',
    type: [CreateParticipantDto],
    example: [
      {
        userId: '507f1f77bcf86cd799439015',
        role: 'specialist',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateParticipantDto)
  additionalParticipants?: CreateParticipantDto[];

  @ApiPropertyOptional({
    description: 'Video room configuration settings',
    type: VideoRoomConfigDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => VideoRoomConfigDto)
  roomConfig?: VideoRoomConfigDto;

  @ApiPropertyOptional({
    description: 'Consultation fee charged for the session',
    example: 500,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  consultationFee?: number;

  @ApiPropertyOptional({
    description: 'Currency for the consultation fee',
    example: 'INR',
    default: 'INR',
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata for the session',
    example: { priority: 'high', language: 'en' },
    type: 'object',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
