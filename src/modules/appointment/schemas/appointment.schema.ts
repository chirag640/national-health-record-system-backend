import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongooseDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { addSoftDeletePlugin } from '../../../common/soft-delete.plugin';

export type AppointmentDocument = Appointment & MongooseDocument;

/**
 * FHIR-compliant Appointment statuses
 * Based on: https://build.fhir.org/valueset-appointmentstatus.html
 */
export enum AppointmentStatus {
  PROPOSED = 'proposed', // Initial request, not yet scheduled
  PENDING = 'pending', // Awaiting confirmation from participants
  BOOKED = 'booked', // All participants confirmed
  ARRIVED = 'arrived', // Patient has checked in
  FULFILLED = 'fulfilled', // Appointment completed successfully
  CANCELLED = 'cancelled', // Cancelled before start
  NO_SHOW = 'noshow', // Patient did not arrive
  ENTERED_IN_ERROR = 'entered-in-error', // Mistakenly created
  CHECKED_IN = 'checked-in', // Patient checked in, waiting
  WAITLIST = 'waitlist', // On waiting list for a slot
}

/**
 * Appointment types based on healthcare standards
 */
export enum AppointmentType {
  CONSULTATION = 'consultation', // Regular consultation
  FOLLOW_UP = 'follow-up', // Follow-up visit
  EMERGENCY = 'emergency', // Emergency appointment
  ROUTINE_CHECKUP = 'routine-checkup', // Routine health checkup
  VACCINATION = 'vaccination', // Vaccination appointment
  LAB_TEST = 'lab-test', // Laboratory test
  SURGERY = 'surgery', // Surgical procedure
  TELEMEDICINE = 'telemedicine', // Virtual consultation
}

/**
 * Participant status in appointment
 */
export enum ParticipantStatus {
  NEEDS_ACTION = 'needs-action', // Participant needs to accept/decline
  ACCEPTED = 'accepted', // Participant accepted
  DECLINED = 'declined', // Participant declined
  TENTATIVE = 'tentative', // Tentatively accepted
}

/**
 * Appointment priority levels
 */
export enum AppointmentPriority {
  ROUTINE = 'routine', // Normal priority
  URGENT = 'urgent', // Needs attention soon
  ASAP = 'asap', // As soon as possible
  STAT = 'stat', // Immediately/Emergency
}

@Schema({ timestamps: true })
export class Appointment {
  // Relationship: Patient → Appointment (One-to-Many)
  @Prop({
    type: String,
    required: true,
    index: true,
    ref: 'Patient',
  })
  patientId!: string;

  // Relationship: Doctor → Appointment (One-to-Many)
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true,
    index: true,
    ref: 'Doctor',
  })
  doctorId!: Types.ObjectId;

  // Relationship: Hospital → Appointment (One-to-Many)
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true,
    index: true,
    ref: 'Hospital',
  })
  hospitalId!: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(AppointmentStatus),
    default: AppointmentStatus.PROPOSED,
    index: true,
  })
  status!: AppointmentStatus;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(AppointmentType),
    index: true,
  })
  appointmentType!: AppointmentType;

  @Prop({
    type: String,
    required: false,
    enum: Object.values(AppointmentPriority),
    default: AppointmentPriority.ROUTINE,
  })
  priority?: AppointmentPriority;

  // Appointment date and time
  @Prop({
    type: Date,
    required: true,
    index: true,
  })
  appointmentDate!: Date;

  @Prop({
    type: String,
    required: true,
  })
  startTime!: string; // Format: "HH:mm" e.g., "10:00"

  @Prop({
    type: String,
    required: true,
  })
  endTime!: string; // Format: "HH:mm" e.g., "10:30"

  @Prop({
    type: Number,
    required: false,
  })
  durationMinutes?: number; // Calculated duration

  // Reason for visit
  @Prop({
    type: String,
    required: true,
  })
  reasonForVisit!: string;

  @Prop({
    type: String,
    required: false,
  })
  symptoms?: string;

  @Prop({
    type: String,
    required: false,
  })
  notes?: string;

  // Patient instructions
  @Prop({
    type: String,
    required: false,
  })
  patientInstructions?: string; // Pre-appointment instructions

  // Cancellation details
  @Prop({
    type: String,
    required: false,
  })
  cancellationReason?: string;

  @Prop({
    type: Date,
    required: false,
  })
  cancellationDate?: Date;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: false,
    ref: 'User',
  })
  cancelledBy?: Types.ObjectId; // Who cancelled the appointment

  // Check-in/Check-out times
  @Prop({
    type: Date,
    required: false,
  })
  checkInTime?: Date;

  @Prop({
    type: Date,
    required: false,
  })
  checkOutTime?: Date;

  // Participant status (doctor confirmation)
  @Prop({
    type: String,
    required: false,
    enum: Object.values(ParticipantStatus),
    default: ParticipantStatus.NEEDS_ACTION,
  })
  doctorStatus?: ParticipantStatus;

  // Reminder notifications
  @Prop({
    type: Boolean,
    required: false,
    default: false,
  })
  reminderSent?: boolean;

  @Prop({
    type: Date,
    required: false,
  })
  reminderSentAt?: Date;

  // Link to encounter if appointment was fulfilled
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: false,
    ref: 'Encounter',
  })
  encounterId?: Types.ObjectId;

  // Waitlist details
  @Prop({
    type: Date,
    required: false,
  })
  requestedStartDate?: Date; // Preferred date (for waitlist)

  @Prop({
    type: Date,
    required: false,
  })
  requestedEndDate?: Date; // Preferred date range end

  // Additional metadata
  @Prop({
    type: MongooseSchema.Types.Mixed,
    required: false,
  })
  metadata?: Record<string, any>;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);

// Apply soft delete plugin for compliance
addSoftDeletePlugin(AppointmentSchema);

// Compound indexes for common query patterns
AppointmentSchema.index({ createdAt: -1 });
AppointmentSchema.index({ patientId: 1, appointmentDate: -1 });
AppointmentSchema.index({ doctorId: 1, appointmentDate: 1, startTime: 1 });
AppointmentSchema.index({ hospitalId: 1, appointmentDate: 1 });
AppointmentSchema.index({ status: 1, appointmentDate: 1 });
AppointmentSchema.index({ appointmentType: 1, status: 1 });
AppointmentSchema.index({ doctorId: 1, status: 1, appointmentDate: 1 });

// Text index for search
AppointmentSchema.index({ reasonForVisit: 'text', symptoms: 'text', notes: 'text' });
