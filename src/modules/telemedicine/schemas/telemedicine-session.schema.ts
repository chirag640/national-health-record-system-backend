import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types, Model } from 'mongoose';
import { addSoftDeletePlugin } from '../../../common/soft-delete.plugin';

export type TelemedicineSessionDocument = TelemedicineSession & Document;

export enum SessionType {
  VIDEO = 'video',
  AUDIO = 'audio',
  CHAT = 'chat',
}

export enum SessionStatus {
  SCHEDULED = 'scheduled',
  WAITING = 'waiting',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
  NO_SHOW = 'no-show',
}

export enum ParticipantRole {
  DOCTOR = 'doctor',
  PATIENT = 'patient',
  SPECIALIST = 'specialist',
  NURSE = 'nurse',
  OBSERVER = 'observer',
}

export enum ParticipantStatus {
  INVITED = 'invited',
  JOINED = 'joined',
  LEFT = 'left',
  DISCONNECTED = 'disconnected',
}

export enum RecordingStatus {
  NOT_STARTED = 'not-started',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Schema({ _id: false })
export class Participant {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, enum: Object.values(ParticipantRole) })
  role!: ParticipantRole;

  @Prop({
    required: true,
    enum: Object.values(ParticipantStatus),
    default: ParticipantStatus.INVITED,
  })
  status!: ParticipantStatus;

  @Prop()
  joinedAt?: Date;

  @Prop()
  leftAt?: Date;

  @Prop({ default: 0 })
  duration?: number; // Duration in seconds

  @Prop()
  connectionQuality?: string; // excellent, good, fair, poor

  @Prop({ default: false })
  microphoneMuted?: boolean;

  @Prop({ default: false })
  videoDisabled?: boolean;
}

const ParticipantSchema = SchemaFactory.createForClass(Participant);

@Schema({ _id: false })
export class ChatMessage {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
  senderId!: Types.ObjectId;

  @Prop({ required: true })
  senderName!: string;

  @Prop({ required: true })
  message!: string;

  @Prop({ default: Date.now })
  timestamp!: Date;

  @Prop({ default: false })
  isSystemMessage?: boolean;
}

const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);

@Schema({ _id: false })
export class Recording {
  @Prop({
    required: true,
    enum: Object.values(RecordingStatus),
    default: RecordingStatus.NOT_STARTED,
  })
  status: RecordingStatus;

  @Prop()
  recordingSid?: string; // Twilio Recording SID

  @Prop()
  recordingUrl?: string;

  @Prop()
  startedAt?: Date;

  @Prop()
  completedAt?: Date;

  @Prop({ default: 0 })
  duration?: number; // Duration in seconds

  @Prop({ default: 0 })
  fileSize?: number; // File size in bytes

  @Prop({ default: false })
  consentGiven!: boolean;

  @Prop()
  consentGivenBy?: Types.ObjectId;

  @Prop()
  consentGivenAt?: Date;
}

const RecordingSchema = SchemaFactory.createForClass(Recording);

@Schema({ _id: false })
export class VideoRoomConfig {
  @Prop()
  roomSid?: string; // Twilio Room SID

  @Prop()
  roomName?: string;

  @Prop({ default: 4 })
  maxParticipants!: number;

  @Prop({ default: true })
  enableVideo!: boolean;

  @Prop({ default: true })
  enableAudio!: boolean;

  @Prop({ default: false })
  enableScreenShare!: boolean;

  @Prop({ default: false })
  enableRecording!: boolean;

  @Prop({ default: 60 })
  maxDuration!: number; // Maximum duration in minutes

  @Prop({ default: 'group' })
  roomType!: string; // group, peer-to-peer, group-small

  @Prop({ type: MongooseSchema.Types.Mixed })
  twilioConfig?: Record<string, any>;
}

const VideoRoomConfigSchema = SchemaFactory.createForClass(VideoRoomConfig);

@Schema({ _id: false })
export class SessionMetrics {
  @Prop({ default: 0 })
  totalDuration!: number; // Total session duration in seconds

  @Prop({ default: 0 })
  videoDuration!: number;

  @Prop({ default: 0 })
  audioDuration!: number;

  @Prop({ default: 0 })
  chatMessageCount!: number;

  @Prop({ default: 0 })
  disconnectionCount!: number;

  @Prop()
  averageConnectionQuality?: string;

  @Prop({ type: [String], default: [] })
  technicalIssues!: string[];
}

const SessionMetricsSchema = SchemaFactory.createForClass(SessionMetrics);

@Schema({ timestamps: true })
export class TelemedicineSession {
  @Prop()
  sessionId?: string; // AUTO: TELE-2024-NNNNNN

  @Prop({ required: true, enum: Object.values(SessionType), default: SessionType.VIDEO })
  sessionType: SessionType;

  @Prop({ required: true, enum: Object.values(SessionStatus), default: SessionStatus.SCHEDULED })
  status: SessionStatus;

  // Related Entities
  @Prop({ required: true })
  patientId: string; // Patient GUID

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, ref: 'Doctor' })
  doctorId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Hospital' })
  hospitalId?: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Appointment' })
  appointmentId?: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Encounter' })
  encounterId?: Types.ObjectId;

  // Session Details
  @Prop({ required: true })
  scheduledStartTime: Date;

  @Prop({ required: true })
  scheduledEndTime: Date;

  @Prop()
  actualStartTime?: Date;

  @Prop()
  actualEndTime?: Date;

  @Prop()
  title: string;

  @Prop()
  description?: string;

  @Prop()
  chiefComplaint?: string;

  // Participants
  @Prop({ type: [ParticipantSchema], default: [] })
  participants: Participant[];

  // Video Room Configuration
  @Prop({ type: VideoRoomConfigSchema })
  roomConfig?: VideoRoomConfig;

  // Chat History
  @Prop({ type: [ChatMessageSchema], default: [] })
  chatHistory: ChatMessage[];

  // Recording
  @Prop({ type: RecordingSchema })
  recording?: Recording;

  // Session Metrics
  @Prop({ type: SessionMetricsSchema })
  metrics?: SessionMetrics;

  // Clinical Notes (Added after session)
  @Prop()
  clinicalNotes?: string;

  @Prop()
  diagnosis?: string;

  @Prop({ type: [String], default: [] })
  prescriptions: string[]; // Array of prescription IDs

  @Prop({ type: [String], default: [] })
  labOrders: string[]; // Array of lab report IDs

  @Prop()
  followUpRequired?: boolean;

  @Prop()
  followUpDate?: Date;

  // Billing
  @Prop({ default: 0 })
  consultationFee?: number;

  @Prop({ default: 'INR' })
  currency?: string;

  @Prop({ default: false })
  isPaid?: boolean;

  @Prop()
  paymentId?: string;

  // Cancellation
  @Prop()
  cancelledBy?: Types.ObjectId;

  @Prop()
  cancellationReason?: string;

  @Prop()
  cancelledAt?: Date;

  // Technical Details
  @Prop()
  connectionToken?: string; // Temporary token for joining

  @Prop()
  connectionTokenExpiresAt?: Date;

  @Prop({ type: MongooseSchema.Types.Mixed })
  metadata?: Record<string, any>;

  // Notifications
  @Prop({ default: false })
  reminderSent?: boolean;

  @Prop({ default: false })
  completionNotificationSent?: boolean;

  // Soft Delete
  @Prop()
  deletedAt?: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export const TelemedicineSessionSchema = SchemaFactory.createForClass(TelemedicineSession);

// Apply soft delete plugin
addSoftDeletePlugin(TelemedicineSessionSchema);

// Indexes for performance
TelemedicineSessionSchema.index({ sessionId: 1 });
TelemedicineSessionSchema.index({ patientId: 1, status: 1 });
TelemedicineSessionSchema.index({ doctorId: 1, status: 1 });
TelemedicineSessionSchema.index({ hospitalId: 1, status: 1 });
TelemedicineSessionSchema.index({ appointmentId: 1 });
TelemedicineSessionSchema.index({ scheduledStartTime: 1 });
TelemedicineSessionSchema.index({ status: 1, scheduledStartTime: 1 });
TelemedicineSessionSchema.index({ 'participants.userId': 1 });
TelemedicineSessionSchema.index({ 'roomConfig.roomSid': 1 });
TelemedicineSessionSchema.index({ deletedAt: 1 });
TelemedicineSessionSchema.index({ createdAt: -1 });

// Pre-save middleware to generate sessionId
TelemedicineSessionSchema.pre('save', async function (next) {
  if (!this.sessionId) {
    const year = new Date().getFullYear();
    const count = await (this.constructor as Model<TelemedicineSessionDocument>).countDocuments();
    this.sessionId = `TELE-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Virtual for session duration
TelemedicineSessionSchema.virtual('duration').get(function () {
  if (this.actualStartTime && this.actualEndTime) {
    return Math.floor((this.actualEndTime.getTime() - this.actualStartTime.getTime()) / 1000);
  }
  return 0;
});

// Virtual for is active
TelemedicineSessionSchema.virtual('isActive').get(function () {
  return this.status === SessionStatus.IN_PROGRESS || this.status === SessionStatus.WAITING;
});

// Virtual for is scheduled in future
TelemedicineSessionSchema.virtual('isUpcoming').get(function () {
  return this.status === SessionStatus.SCHEDULED && this.scheduledStartTime > new Date();
});

// Ensure virtuals are included in JSON
TelemedicineSessionSchema.set('toJSON', { virtuals: true });
TelemedicineSessionSchema.set('toObject', { virtuals: true });
