import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongooseDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type DoctorAvailabilityDocument = DoctorAvailability & MongooseDocument;

/**
 * Doctor availability schedule for appointment booking
 * Manages time slots for each doctor
 */
@Schema({ timestamps: true })
export class DoctorAvailability {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true,
    index: true,
    ref: 'Doctor',
  })
  doctorId!: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true,
    index: true,
    ref: 'Hospital',
  })
  hospitalId!: Types.ObjectId;

  // Day of week (0 = Sunday, 6 = Saturday)
  @Prop({
    type: Number,
    required: true,
    min: 0,
    max: 6,
    index: true,
  })
  dayOfWeek!: number;

  // Time slots
  @Prop({
    type: String,
    required: true,
  })
  startTime!: string; // Format: "09:00"

  @Prop({
    type: String,
    required: true,
  })
  endTime!: string; // Format: "17:00"

  // Slot duration in minutes
  @Prop({
    type: Number,
    required: true,
    default: 30,
  })
  slotDuration!: number;

  // Maximum appointments per slot
  @Prop({
    type: Number,
    required: false,
    default: 1,
  })
  maxAppointmentsPerSlot?: number;

  // Is this availability active?
  @Prop({
    type: Boolean,
    required: false,
    default: true,
  })
  isActive!: boolean;

  // Special dates when doctor is unavailable
  @Prop({
    type: [Date],
    required: false,
  })
  blockedDates?: Date[];

  // Notes about availability
  @Prop({
    type: String,
    required: false,
  })
  notes?: string;
}

export const DoctorAvailabilitySchema = SchemaFactory.createForClass(DoctorAvailability);

// Compound indexes
DoctorAvailabilitySchema.index({ doctorId: 1, dayOfWeek: 1, isActive: 1 });
DoctorAvailabilitySchema.index({ hospitalId: 1, dayOfWeek: 1 });
DoctorAvailabilitySchema.index({ doctorId: 1, isActive: 1 });

// Ensure unique doctor availability per day
DoctorAvailabilitySchema.index({ doctorId: 1, dayOfWeek: 1 }, { unique: true });
