import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional, IsString, IsBoolean, IsDate, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTelemedicineSessionDto } from './create-telemedicine-session.dto';
import { SessionStatus } from '../schemas/telemedicine-session.schema';

export class UpdateTelemedicineSessionDto extends PartialType(CreateTelemedicineSessionDto) {
  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  actualStartTime?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  actualEndTime?: Date;

  @IsOptional()
  @IsString()
  clinicalNotes?: string;

  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prescriptions?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labOrders?: string[];

  @IsOptional()
  @IsBoolean()
  followUpRequired?: boolean;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  followUpDate?: Date;

  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @IsOptional()
  @IsString()
  paymentId?: string;

  @IsOptional()
  @IsString()
  cancellationReason?: string;
}

export class UpdateSessionStatusDto {
  @IsEnum(SessionStatus)
  status: SessionStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class AddClinicalNotesDto {
  @IsString()
  clinicalNotes: string;

  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prescriptions?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labOrders?: string[];

  @IsOptional()
  @IsBoolean()
  followUpRequired?: boolean;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  followUpDate?: Date;
}

export class RecordingConsentDto {
  @IsBoolean()
  consentGiven: boolean;

  @IsString()
  userId: string;
}
