import { ApiProperty } from '@nestjs/swagger';
import {
  AppointmentStatus,
  AppointmentType,
  AppointmentPriority,
  ParticipantStatus,
} from '../schemas/appointment.schema';

export class AppointmentOutputDto {
  @ApiProperty({
    description: 'Unique identifier',
    example: '507f1f77bcf86cd799439011',
  })
  id!: string;

  @ApiProperty({
    description: 'Patient GUID reference',
    example: 'NHRS-2025-A3B4C5D6',
  })
  patientId!: string;

  @ApiProperty({
    description: 'Doctor ID reference',
    example: '507f1f77bcf86cd799439011',
  })
  doctorId!: string;

  @ApiProperty({
    description: 'Hospital ID reference',
    example: '507f1f77bcf86cd799439011',
  })
  hospitalId!: string;

  @ApiProperty({
    description: 'Appointment status',
    enum: AppointmentStatus,
    example: AppointmentStatus.BOOKED,
  })
  status!: AppointmentStatus;

  @ApiProperty({
    description: 'Type of appointment',
    enum: AppointmentType,
    example: AppointmentType.CONSULTATION,
  })
  appointmentType!: AppointmentType;

  @ApiProperty({
    description: 'Priority level',
    enum: AppointmentPriority,
    example: AppointmentPriority.ROUTINE,
  })
  priority?: AppointmentPriority;

  @ApiProperty({
    description: 'Appointment date',
    example: '2025-12-15T00:00:00.000Z',
  })
  appointmentDate!: Date;

  @ApiProperty({
    description: 'Start time',
    example: '10:00',
  })
  startTime!: string;

  @ApiProperty({
    description: 'End time',
    example: '10:30',
  })
  endTime!: string;

  @ApiProperty({
    description: 'Duration in minutes',
    example: 30,
  })
  durationMinutes?: number;

  @ApiProperty({
    description: 'Reason for visit',
    example: 'Regular checkup and blood pressure monitoring',
  })
  reasonForVisit!: string;

  @ApiProperty({
    description: 'Patient symptoms',
    example: 'Headache, fever, fatigue',
  })
  symptoms?: string;

  @ApiProperty({
    description: 'Additional notes',
    example: 'Patient prefers morning appointments',
  })
  notes?: string;

  @ApiProperty({
    description: 'Patient instructions',
    example: 'Please arrive 10 minutes early',
  })
  patientInstructions?: string;

  @ApiProperty({
    description: 'Cancellation reason',
    example: 'Patient requested reschedule',
  })
  cancellationReason?: string;

  @ApiProperty({
    description: 'Cancellation date',
    example: '2025-12-10T14:30:00.000Z',
  })
  cancellationDate?: Date;

  @ApiProperty({
    description: 'Who cancelled the appointment',
    example: '507f1f77bcf86cd799439012',
  })
  cancelledBy?: string;

  @ApiProperty({
    description: 'Check-in time',
    example: '2025-12-15T09:55:00.000Z',
  })
  checkInTime?: Date;

  @ApiProperty({
    description: 'Check-out time',
    example: '2025-12-15T10:35:00.000Z',
  })
  checkOutTime?: Date;

  @ApiProperty({
    description: 'Doctor participation status',
    enum: ParticipantStatus,
    example: ParticipantStatus.ACCEPTED,
  })
  doctorStatus?: ParticipantStatus;

  @ApiProperty({
    description: 'Reminder sent flag',
    example: true,
  })
  reminderSent?: boolean;

  @ApiProperty({
    description: 'Reminder sent timestamp',
    example: '2025-12-14T10:00:00.000Z',
  })
  reminderSentAt?: Date;

  @ApiProperty({
    description: 'Linked encounter ID',
    example: '507f1f77bcf86cd799439020',
  })
  encounterId?: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-12-01T10:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-12-01T10:00:00.000Z',
  })
  updatedAt!: Date;
}
