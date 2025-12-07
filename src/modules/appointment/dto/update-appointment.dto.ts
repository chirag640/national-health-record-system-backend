import { PartialType } from '@nestjs/swagger';
import { CreateAppointmentDto } from './create-appointment.dto';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import sanitizeHtml from 'sanitize-html';
import { AppointmentStatus, ParticipantStatus } from '../schemas/appointment.schema';

export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {
  @ApiProperty({
    description: 'Appointment status',
    enum: AppointmentStatus,
    example: AppointmentStatus.BOOKED,
    required: false,
  })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiProperty({
    description: 'Doctor participation status',
    enum: ParticipantStatus,
    example: ParticipantStatus.ACCEPTED,
    required: false,
  })
  @IsOptional()
  @IsEnum(ParticipantStatus)
  doctorStatus?: ParticipantStatus;

  @ApiProperty({
    description: 'Cancellation reason (required if cancelling)',
    example: 'Patient requested reschedule due to personal emergency',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return value;
    const trimmed = value.trim();
    return sanitizeHtml(trimmed, { allowedTags: [], allowedAttributes: {} });
  })
  @IsString()
  @MaxLength(500)
  cancellationReason?: string;
}
