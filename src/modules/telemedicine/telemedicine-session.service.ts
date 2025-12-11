import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { TelemedicineSessionRepository } from './telemedicine-session.repository';
import { TwilioVideoService } from './services/twilio-video.service';
import { NotificationService } from '../notification/notification.service';
import {
  CreateTelemedicineSessionDto,
  UpdateTelemedicineSessionDto,
  AddClinicalNotesDto,
  RecordingConsentDto,
} from './dto';
import {
  TelemedicineSessionOutputDto,
  PaginatedTelemedicineSessionsDto,
  SessionStatsDto,
  JoinSessionResponseDto,
} from './dto/telemedicine-session-output.dto';
import { TelemedicineSessionFilterDto } from './dto/telemedicine-session-filter.dto';
import {
  TelemedicineSession,
  SessionStatus,
  ParticipantStatus,
  ParticipantRole,
  RecordingStatus,
} from './schemas/telemedicine-session.schema';
import {
  NotificationChannel,
  NotificationPriority,
  NotificationType,
} from '../notification/schemas/notification.schema';
import { plainToClass } from 'class-transformer';

@Injectable()
export class TelemedicineSessionService {
  private readonly logger = new Logger(TelemedicineSessionService.name);

  constructor(
    private readonly repository: TelemedicineSessionRepository,
    private readonly twilioVideoService: TwilioVideoService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Create a new telemedicine session
   */
  async create(createDto: CreateTelemedicineSessionDto): Promise<TelemedicineSessionOutputDto> {
    try {
      // Validate dates
      if (createDto.scheduledEndTime <= createDto.scheduledStartTime) {
        throw new BadRequestException('End time must be after start time');
      }

      // Prepare session data
      const sessionData: Partial<TelemedicineSession> = {
        sessionType: createDto.sessionType,
        status: SessionStatus.SCHEDULED,
        patientId: createDto.patientId,
        doctorId: new Types.ObjectId(createDto.doctorId),
        hospitalId: createDto.hospitalId ? new Types.ObjectId(createDto.hospitalId) : undefined,
        appointmentId: createDto.appointmentId
          ? new Types.ObjectId(createDto.appointmentId)
          : undefined,
        scheduledStartTime: createDto.scheduledStartTime,
        scheduledEndTime: createDto.scheduledEndTime,
        title: createDto.title,
        description: createDto.description,
        chiefComplaint: createDto.chiefComplaint,
        consultationFee: createDto.consultationFee || 0,
        currency: createDto.currency || 'INR',
        metadata: createDto.metadata,
      };

      // Initialize participants
      sessionData.participants = [
        {
          userId: new Types.ObjectId(createDto.doctorId),
          role: ParticipantRole.DOCTOR,
          status: ParticipantStatus.INVITED,
        } as any,
        {
          userId: new Types.ObjectId(createDto.patientId),
          role: ParticipantRole.PATIENT,
          status: ParticipantStatus.INVITED,
        } as any,
      ];

      // Add additional participants
      if (createDto.additionalParticipants && sessionData.participants) {
        createDto.additionalParticipants.forEach((p) => {
          sessionData.participants!.push({
            userId: new Types.ObjectId(p.userId),
            role: p.role,
            status: ParticipantStatus.INVITED,
          } as any);
        });
      }

      // Set room configuration
      sessionData.roomConfig = {
        maxParticipants: createDto.roomConfig?.maxParticipants || 4,
        enableVideo: createDto.roomConfig?.enableVideo !== false,
        enableAudio: createDto.roomConfig?.enableAudio !== false,
        enableScreenShare: createDto.roomConfig?.enableScreenShare || false,
        enableRecording: createDto.roomConfig?.enableRecording || false,
        maxDuration: createDto.roomConfig?.maxDuration || 60,
        roomType: createDto.roomConfig?.roomType || 'group',
      } as any;

      // Initialize metrics
      sessionData.metrics = {
        totalDuration: 0,
        videoDuration: 0,
        audioDuration: 0,
        chatMessageCount: 0,
        disconnectionCount: 0,
        technicalIssues: [],
      } as any;

      // Create session
      const session = await this.repository.create(sessionData);

      // Send notifications
      await this.sendSessionScheduledNotifications(session);

      this.logger.log(`Telemedicine session created: ${session.sessionId}`);

      return plainToClass(TelemedicineSessionOutputDto, session.toObject(), {
        excludeExtraneousValues: true,
      });
    } catch (error: any) {
      this.logger.error(`Failed to create session: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get session by ID
   */
  async findById(id: string): Promise<TelemedicineSessionOutputDto> {
    const session = await this.repository.findById(id);

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    return plainToClass(TelemedicineSessionOutputDto, session.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Get session by session ID
   */
  async findBySessionId(sessionId: string): Promise<TelemedicineSessionOutputDto> {
    const session = await this.repository.findBySessionId(sessionId);

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    return plainToClass(TelemedicineSessionOutputDto, session.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Get all sessions with filtering
   */
  async findAll(filter: TelemedicineSessionFilterDto): Promise<PaginatedTelemedicineSessionsDto> {
    const { sessions, total, page, limit } = await this.repository.findAll(filter);

    const data = sessions.map((session) =>
      plainToClass(TelemedicineSessionOutputDto, session.toObject(), {
        excludeExtraneousValues: true,
      }),
    );

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    };
  }

  /**
   * Update session
   */
  async update(
    id: string,
    updateDto: UpdateTelemedicineSessionDto,
  ): Promise<TelemedicineSessionOutputDto> {
    const existingSession = await this.repository.findById(id);

    if (!existingSession) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    // Check status change
    const statusChanged = updateDto.status && updateDto.status !== existingSession.status;

    // Prepare update data
    const updateData: any = { ...updateDto };

    // Convert IDs to ObjectId
    if (updateDto.doctorId) {
      updateData.doctorId = new Types.ObjectId(updateDto.doctorId);
    }
    if (updateDto.hospitalId) {
      updateData.hospitalId = new Types.ObjectId(updateDto.hospitalId);
    }

    // Update session
    const updatedSession = await this.repository.update(id, updateData);

    if (!updatedSession) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    // Handle status change notifications
    if (statusChanged) {
      await this.handleStatusChange(updatedSession, existingSession.status, updateDto.status!);
    }

    this.logger.log(`Session ${id} updated`);

    return plainToClass(TelemedicineSessionOutputDto, updatedSession.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Start a session (join video room)
   */
  async startSession(sessionId: string, userId: string): Promise<JoinSessionResponseDto> {
    const session = await this.repository.findById(sessionId);

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    // Check if user is a participant
    const participant = session.participants.find((p) => p.userId.toString() === userId);

    if (!participant) {
      throw new BadRequestException('You are not a participant in this session');
    }

    // Check session status
    if (session.status === SessionStatus.COMPLETED) {
      throw new BadRequestException('Session is already completed');
    }

    if (session.status === SessionStatus.CANCELLED) {
      throw new BadRequestException('Session is cancelled');
    }

    // Create Twilio video room if not exists
    let roomName = session.roomConfig?.roomName;
    let roomSid = session.roomConfig?.roomSid;

    if (!roomSid) {
      roomName = `session-${session.sessionId}`;

      if (this.twilioVideoService.isConfigured()) {
        const room = await this.twilioVideoService.createRoom(roomName, session.roomConfig);
        roomSid = room.sid;

        // Update session with room details
        await this.repository.update(sessionId, {
          'roomConfig.roomSid': roomSid,
          'roomConfig.roomName': roomName,
        } as any);
      }
    }

    // Generate access token
    let accessToken = '';
    let expiresAt = new Date();

    if (this.twilioVideoService.isConfigured()) {
      const tokenData = await this.twilioVideoService.generateAccessToken(
        roomName!,
        userId,
        session.roomConfig?.maxDuration || 60,
      );
      accessToken = tokenData.token;
      expiresAt = tokenData.expiresAt;
    }

    // Update participant status
    await this.repository.updateParticipantStatus(sessionId, userId, ParticipantStatus.JOINED);

    // Update session status if first participant joining
    if (session.status === SessionStatus.SCHEDULED) {
      await this.repository.updateStatus(sessionId, SessionStatus.WAITING);
    } else if (session.status === SessionStatus.WAITING) {
      // If second participant joins, mark as in-progress
      await this.repository.updateStatus(sessionId, SessionStatus.IN_PROGRESS);
    }

    this.logger.log(`User ${userId} joined session ${sessionId}`);

    return {
      sessionId: session.sessionId!,
      roomName: roomName!,
      accessToken,
      expiresAt,
      participants: session.participants.map((p) =>
        plainToClass(TelemedicineSessionOutputDto, p, { excludeExtraneousValues: true }),
      ) as any,
      roomConfig: session.roomConfig as any,
    };
  }

  /**
   * End a session
   */
  async endSession(sessionId: string, userId: string): Promise<TelemedicineSessionOutputDto> {
    const session = await this.repository.findById(sessionId);

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    // Check if user is doctor (only doctor can end session)
    const isDoctor = session.participants.some(
      (p) => p.userId.toString() === userId && p.role === ParticipantRole.DOCTOR,
    );

    if (!isDoctor) {
      throw new BadRequestException('Only doctor can end the session');
    }

    // Complete Twilio room
    if (session.roomConfig?.roomSid && this.twilioVideoService.isConfigured()) {
      await this.twilioVideoService.completeRoom(session.roomConfig.roomSid);
    }

    // Update session status
    const updatedSession = await this.repository.updateStatus(sessionId, SessionStatus.COMPLETED);

    if (!updatedSession) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    // Send completion notifications
    await this.sendSessionCompletedNotifications(updatedSession);

    this.logger.log(`Session ${sessionId} ended`);

    return plainToClass(TelemedicineSessionOutputDto, updatedSession.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Cancel a session
   */
  async cancelSession(
    sessionId: string,
    userId: string,
    reason: string,
  ): Promise<TelemedicineSessionOutputDto> {
    const session = await this.repository.findById(sessionId);

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    if (session.status === SessionStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed session');
    }

    // Update session
    const updatedSession = await this.repository.update(sessionId, {
      status: SessionStatus.CANCELLED,
      cancelledBy: new Types.ObjectId(userId),
      cancellationReason: reason,
      cancelledAt: new Date(),
    } as any);

    if (!updatedSession) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    // Send cancellation notifications
    await this.sendSessionCancelledNotifications(updatedSession, reason);

    this.logger.log(`Session ${sessionId} cancelled`);

    return plainToClass(TelemedicineSessionOutputDto, updatedSession.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Add clinical notes after session
   */
  async addClinicalNotes(
    sessionId: string,
    notesDto: AddClinicalNotesDto,
  ): Promise<TelemedicineSessionOutputDto> {
    const session = await this.repository.findById(sessionId);

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    if (session.status !== SessionStatus.COMPLETED) {
      throw new BadRequestException('Clinical notes can only be added to completed sessions');
    }

    const updatedSession = await this.repository.update(sessionId, notesDto as any);

    if (!updatedSession) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    this.logger.log(`Clinical notes added to session ${sessionId}`);

    return plainToClass(TelemedicineSessionOutputDto, updatedSession.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Set recording consent
   */
  async setRecordingConsent(sessionId: string, consentDto: RecordingConsentDto): Promise<void> {
    const session = await this.repository.findById(sessionId);

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    const recordingData = {
      status: RecordingStatus.NOT_STARTED,
      consentGiven: consentDto.consentGiven,
      consentGivenBy: new Types.ObjectId(consentDto.userId),
      consentGivenAt: new Date(),
    };

    await this.repository.updateRecording(sessionId, recordingData);

    this.logger.log(
      `Recording consent ${consentDto.consentGiven ? 'given' : 'denied'} for session ${sessionId}`,
    );
  }

  /**
   * Get session statistics
   */
  async getStatistics(filter?: any): Promise<SessionStatsDto> {
    return this.repository.getStatistics(filter);
  }

  /**
   * Delete session (soft delete)
   */
  async delete(id: string): Promise<void> {
    const deleted = await this.repository.softDelete(id);

    if (!deleted) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    this.logger.log(`Session ${id} deleted`);
  }

  // Private helper methods

  private async sendSessionScheduledNotifications(session: any): Promise<void> {
    try {
      // Notify doctor
      await this.notificationService.create({
        recipientId: session.doctorId.toString(),
        type: NotificationType.SESSION_SCHEDULED,
        title: 'New Telemedicine Session Scheduled',
        message: `You have a ${session.sessionType} consultation scheduled with patient ${session.patientId}`,
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
        priority: NotificationPriority.NORMAL,
        relatedEntityId: session._id.toString(),
        relatedEntityModel: 'TelemedicineSession',
      });

      // Notify patient
      await this.notificationService.create({
        recipientId: session.patientId,
        type: NotificationType.SESSION_SCHEDULED,
        title: 'Telemedicine Session Scheduled',
        message: `Your ${session.sessionType} consultation has been scheduled`,
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH, NotificationChannel.EMAIL],
        priority: NotificationPriority.NORMAL,
        relatedEntityId: session._id.toString(),
        relatedEntityModel: 'TelemedicineSession',
      });
    } catch (error: any) {
      this.logger.error(`Failed to send scheduled notifications: ${error.message}`);
    }
  }

  private async sendSessionCompletedNotifications(session: any): Promise<void> {
    try {
      // Notify patient
      await this.notificationService.create({
        recipientId: session.patientId,
        type: NotificationType.SESSION_COMPLETED,
        title: 'Consultation Completed',
        message: 'Your telemedicine consultation has been completed',
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
        priority: NotificationPriority.NORMAL,
        relatedEntityId: session._id.toString(),
        relatedEntityModel: 'TelemedicineSession',
      });
    } catch (error: any) {
      this.logger.error(`Failed to send completion notifications: ${error.message}`);
    }
  }

  private async sendSessionCancelledNotifications(session: any, reason: string): Promise<void> {
    try {
      const participants = [session.doctorId.toString(), session.patientId];

      for (const participantId of participants) {
        await this.notificationService.create({
          recipientId: participantId,
          type: NotificationType.SESSION_CANCELLED,
          title: 'Telemedicine Session Cancelled',
          message: `Session has been cancelled. Reason: ${reason}`,
          channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH, NotificationChannel.SMS],
          priority: NotificationPriority.HIGH,
          relatedEntityId: session._id.toString(),
          relatedEntityModel: 'TelemedicineSession',
        });
      }
    } catch (error: any) {
      this.logger.error(`Failed to send cancellation notifications: ${error.message}`);
    }
  }

  private async handleStatusChange(
    session: any,
    oldStatus: SessionStatus,
    newStatus: SessionStatus,
  ): Promise<void> {
    this.logger.log(
      `Session ${session.sessionId} status changed from ${oldStatus} to ${newStatus}`,
    );
    // Additional logic based on status changes can be added here
  }
}
