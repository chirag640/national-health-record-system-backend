import {
  IsOptional,
  IsEnum,
  IsString,
  IsDate,
  IsBoolean,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  SessionType,
  SessionStatus,
  ParticipantRole,
} from '../schemas/telemedicine-session.schema';

export class TelemedicineSessionFilterDto {
  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  patientId?: string;

  @IsOptional()
  @IsString()
  doctorId?: string;

  @IsOptional()
  @IsString()
  hospitalId?: string;

  @IsOptional()
  @IsString()
  appointmentId?: string;

  @IsOptional()
  @IsEnum(SessionType)
  sessionType?: SessionType;

  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isUpcoming?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  hasRecording?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isPaid?: boolean;

  @IsOptional()
  @IsString()
  participantUserId?: string;

  @IsOptional()
  @IsEnum(ParticipantRole)
  participantRole?: ParticipantRole;

  @IsOptional()
  @IsString()
  search?: string; // Search in title, description, chiefComplaint

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  sortBy?: string; // Field to sort by

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
