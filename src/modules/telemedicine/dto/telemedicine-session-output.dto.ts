import { Exclude, Expose, Type } from 'class-transformer';
import {
  SessionType,
  SessionStatus,
  ParticipantRole,
  ParticipantStatus,
  RecordingStatus,
} from '../schemas/telemedicine-session.schema';

export class ParticipantOutputDto {
  @Expose()
  userId: string;

  @Expose()
  role: ParticipantRole;

  @Expose()
  status: ParticipantStatus;

  @Expose()
  joinedAt?: Date;

  @Expose()
  leftAt?: Date;

  @Expose()
  duration?: number;

  @Expose()
  connectionQuality?: string;

  @Expose()
  microphoneMuted?: boolean;

  @Expose()
  videoDisabled?: boolean;
}

export class ChatMessageOutputDto {
  @Expose()
  senderId: string;

  @Expose()
  senderName: string;

  @Expose()
  message: string;

  @Expose()
  timestamp: Date;

  @Expose()
  isSystemMessage?: boolean;
}

export class RecordingOutputDto {
  @Expose()
  status: RecordingStatus;

  @Expose()
  recordingUrl?: string;

  @Expose()
  startedAt?: Date;

  @Expose()
  completedAt?: Date;

  @Expose()
  duration?: number;

  @Expose()
  fileSize?: number;

  @Expose()
  consentGiven: boolean;

  @Expose()
  consentGivenAt?: Date;

  @Exclude()
  recordingSid?: string;

  @Exclude()
  consentGivenBy?: string;
}

export class VideoRoomConfigOutputDto {
  @Expose()
  roomName?: string;

  @Expose()
  maxParticipants: number;

  @Expose()
  enableVideo: boolean;

  @Expose()
  enableAudio: boolean;

  @Expose()
  enableScreenShare: boolean;

  @Expose()
  enableRecording: boolean;

  @Expose()
  maxDuration: number;

  @Expose()
  roomType: string;

  @Exclude()
  roomSid?: string;

  @Exclude()
  twilioConfig?: any;
}

export class SessionMetricsOutputDto {
  @Expose()
  totalDuration: number;

  @Expose()
  videoDuration: number;

  @Expose()
  audioDuration: number;

  @Expose()
  chatMessageCount: number;

  @Expose()
  disconnectionCount: number;

  @Expose()
  averageConnectionQuality?: string;

  @Expose()
  technicalIssues: string[];
}

export class TelemedicineSessionOutputDto {
  @Expose()
  _id: string;

  @Expose()
  sessionId: string;

  @Expose()
  sessionType: SessionType;

  @Expose()
  status: SessionStatus;

  @Expose()
  patientId: string;

  @Expose()
  doctorId: string;

  @Expose()
  hospitalId?: string;

  @Expose()
  appointmentId?: string;

  @Expose()
  encounterId?: string;

  @Expose()
  scheduledStartTime: Date;

  @Expose()
  scheduledEndTime: Date;

  @Expose()
  actualStartTime?: Date;

  @Expose()
  actualEndTime?: Date;

  @Expose()
  title: string;

  @Expose()
  description?: string;

  @Expose()
  chiefComplaint?: string;

  @Expose()
  @Type(() => ParticipantOutputDto)
  participants: ParticipantOutputDto[];

  @Expose()
  @Type(() => VideoRoomConfigOutputDto)
  roomConfig?: VideoRoomConfigOutputDto;

  @Expose()
  @Type(() => ChatMessageOutputDto)
  chatHistory: ChatMessageOutputDto[];

  @Expose()
  @Type(() => RecordingOutputDto)
  recording?: RecordingOutputDto;

  @Expose()
  @Type(() => SessionMetricsOutputDto)
  metrics?: SessionMetricsOutputDto;

  @Expose()
  clinicalNotes?: string;

  @Expose()
  diagnosis?: string;

  @Expose()
  prescriptions: string[];

  @Expose()
  labOrders: string[];

  @Expose()
  followUpRequired?: boolean;

  @Expose()
  followUpDate?: Date;

  @Expose()
  consultationFee?: number;

  @Expose()
  currency?: string;

  @Expose()
  isPaid?: boolean;

  @Expose()
  cancelledBy?: string;

  @Expose()
  cancellationReason?: string;

  @Expose()
  cancelledAt?: Date;

  @Expose()
  reminderSent?: boolean;

  @Expose()
  duration?: number; // Virtual property

  @Expose()
  isActive?: boolean; // Virtual property

  @Expose()
  isUpcoming?: boolean; // Virtual property

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Exclude()
  connectionToken?: string;

  @Exclude()
  connectionTokenExpiresAt?: Date;

  @Exclude()
  paymentId?: string;

  @Exclude()
  metadata?: any;

  @Exclude()
  deletedAt?: Date;
}

export class PaginatedTelemedicineSessionsDto {
  @Expose()
  @Type(() => TelemedicineSessionOutputDto)
  data: TelemedicineSessionOutputDto[];

  @Expose()
  total: number;

  @Expose()
  page: number;

  @Expose()
  limit: number;

  @Expose()
  totalPages: number;

  @Expose()
  hasNextPage: boolean;

  @Expose()
  hasPreviousPage: boolean;
}

export class SessionStatsDto {
  @Expose()
  total: number;

  @Expose()
  scheduled: number;

  @Expose()
  waiting: number;

  @Expose()
  inProgress: number;

  @Expose()
  completed: number;

  @Expose()
  cancelled: number;

  @Expose()
  failed: number;

  @Expose()
  noShow: number;

  @Expose()
  byType: Record<SessionType, number>;

  @Expose()
  totalDuration: number; // Total minutes of completed sessions

  @Expose()
  averageDuration: number; // Average session duration in minutes

  @Expose()
  totalRevenue: number;
}

export class JoinSessionResponseDto {
  @Expose()
  sessionId: string;

  @Expose()
  roomName: string;

  @Expose()
  accessToken: string;

  @Expose()
  expiresAt: Date;

  @Expose()
  @Type(() => ParticipantOutputDto)
  participants: ParticipantOutputDto[];

  @Expose()
  roomConfig: VideoRoomConfigOutputDto;
}
