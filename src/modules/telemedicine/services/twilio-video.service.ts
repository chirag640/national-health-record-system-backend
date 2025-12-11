import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';
import { VideoRoomConfig } from '../schemas/telemedicine-session.schema';

export interface TwilioVideoRoom {
  sid: string;
  uniqueName: string;
  status: string;
  type: string;
  maxParticipants: number;
  duration: number;
  dateCreated: Date;
  dateUpdated: Date;
  url: string;
}

export interface TwilioAccessToken {
  token: string;
  identity: string;
  roomName: string;
  expiresAt: Date;
}

export interface TwilioRecording {
  sid: string;
  status: string;
  duration: number;
  size: number;
  url: string;
  dateCreated: Date;
}

@Injectable()
export class TwilioVideoService {
  private readonly logger = new Logger(TwilioVideoService.name);
  private client: twilio.Twilio;
  private accountSid: string;
  private authToken: string;
  private apiKeySid: string;
  private apiKeySecret: string;

  constructor(private configService: ConfigService) {
    this.accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID') || '';
    this.authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN') || '';
    this.apiKeySid = this.configService.get<string>('TWILIO_API_KEY_SID') || '';
    this.apiKeySecret = this.configService.get<string>('TWILIO_API_KEY_SECRET') || '';

    if (this.accountSid && this.authToken) {
      this.client = twilio(this.accountSid, this.authToken);
      this.logger.log('Twilio Video Service initialized successfully');
    } else {
      this.logger.warn('Twilio credentials not configured. Video features will be disabled.');
    }
  }

  /**
   * Create a new video room
   */
  async createRoom(roomName: string, config?: Partial<VideoRoomConfig>): Promise<TwilioVideoRoom> {
    try {
      if (!this.client) {
        throw new Error('Twilio client not initialized');
      }

      const roomConfig: any = {
        uniqueName: roomName,
        type: config?.roomType || 'group',
        maxParticipants: config?.maxParticipants || 4,
        enableTurn: true,
        statusCallback: this.configService.get<string>('TWILIO_STATUS_CALLBACK_URL'),
      };

      if (config?.enableRecording) {
        roomConfig.recordParticipantsOnConnect = true;
      }

      if (config?.maxDuration) {
        roomConfig.maxParticipantDuration = config.maxDuration * 60; // Convert minutes to seconds
      }

      const room = await this.client.video.v1.rooms.create(roomConfig);

      this.logger.log(`Video room created: ${room.uniqueName} (${room.sid})`);

      return {
        sid: room.sid,
        uniqueName: room.uniqueName,
        status: room.status,
        type: room.type,
        maxParticipants: room.maxParticipants || 4,
        duration: room.duration || 0,
        dateCreated: room.dateCreated,
        dateUpdated: room.dateUpdated,
        url: room.url,
      };
    } catch (error: any) {
      this.logger.error(`Failed to create room: ${error.message}`, error.stack);
      throw new Error(`Failed to create video room: ${error.message}`);
    }
  }

  /**
   * Generate access token for a participant to join a room
   */
  async generateAccessToken(
    roomName: string,
    identity: string,
    expiryMinutes = 60,
  ): Promise<TwilioAccessToken> {
    try {
      if (!this.apiKeySid || !this.apiKeySecret) {
        throw new Error('Twilio API keys not configured');
      }

      const AccessToken = twilio.jwt.AccessToken;
      const VideoGrant = AccessToken.VideoGrant;

      const token = new AccessToken(this.accountSid, this.apiKeySid, this.apiKeySecret, {
        ttl: expiryMinutes * 60,
        identity,
      });

      const videoGrant = new VideoGrant({
        room: roomName,
      });

      token.addGrant(videoGrant);

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);

      this.logger.log(`Access token generated for ${identity} in room ${roomName}`);

      return {
        token: token.toJwt(),
        identity,
        roomName,
        expiresAt,
      };
    } catch (error: any) {
      this.logger.error(`Failed to generate access token: ${error.message}`, error.stack);
      throw new Error(`Failed to generate access token: ${error.message}`);
    }
  }

  /**
   * Get room details by SID
   */
  async getRoom(roomSid: string): Promise<TwilioVideoRoom | null> {
    try {
      if (!this.client) {
        throw new Error('Twilio client not initialized');
      }

      const room = await this.client.video.v1.rooms(roomSid).fetch();

      return {
        sid: room.sid,
        uniqueName: room.uniqueName,
        status: room.status,
        type: room.type,
        maxParticipants: room.maxParticipants || 4,
        duration: room.duration || 0,
        dateCreated: room.dateCreated,
        dateUpdated: room.dateUpdated,
        url: room.url,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get room ${roomSid}: ${error.message}`);
      return null;
    }
  }

  /**
   * Get room by unique name
   */
  async getRoomByName(roomName: string): Promise<TwilioVideoRoom | null> {
    try {
      if (!this.client) {
        throw new Error('Twilio client not initialized');
      }

      const rooms = await this.client.video.v1.rooms.list({
        uniqueName: roomName,
        limit: 1,
      });

      if (!rooms || rooms.length === 0) {
        return null;
      }

      const room = rooms[0];
      if (!room) {
        return null;
      }

      return {
        sid: room.sid,
        uniqueName: room.uniqueName,
        status: room.status,
        type: room.type,
        maxParticipants: room.maxParticipants || 4,
        duration: room.duration || 0,
        dateCreated: room.dateCreated,
        dateUpdated: room.dateUpdated,
        url: room.url,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get room by name ${roomName}: ${error.message}`);
      return null;
    }
  }

  /**
   * Complete (end) a room
   */
  async completeRoom(roomSid: string): Promise<boolean> {
    try {
      if (!this.client) {
        throw new Error('Twilio client not initialized');
      }

      await this.client.video.v1.rooms(roomSid).update({ status: 'completed' });

      this.logger.log(`Room ${roomSid} completed`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to complete room ${roomSid}: ${error.message}`);
      return false;
    }
  }

  /**
   * Get participants in a room
   */
  async getParticipants(roomSid: string): Promise<any[]> {
    try {
      if (!this.client) {
        throw new Error('Twilio client not initialized');
      }

      const participants = await this.client.video.v1.rooms(roomSid).participants.list();

      return participants.map((p) => ({
        sid: p.sid,
        identity: p.identity,
        status: p.status,
        duration: p.duration,
        dateCreated: p.dateCreated,
        dateUpdated: p.dateUpdated,
      }));
    } catch (error: any) {
      this.logger.error(`Failed to get participants for room ${roomSid}: ${error.message}`);
      return [];
    }
  }

  /**
   * Disconnect a participant from a room
   */
  async disconnectParticipant(roomSid: string, participantSid: string): Promise<boolean> {
    try {
      if (!this.client) {
        throw new Error('Twilio client not initialized');
      }

      await this.client.video.v1.rooms(roomSid).participants(participantSid).update({
        status: 'disconnected',
      });

      this.logger.log(`Participant ${participantSid} disconnected from room ${roomSid}`);
      return true;
    } catch (error: any) {
      this.logger.error(
        `Failed to disconnect participant ${participantSid} from room ${roomSid}: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * Start recording for a room
   */
  async startRecording(roomSid: string): Promise<string | null> {
    this.logger.warn(
      `Ad-hoc recording creation is not supported for room ${roomSid}. Configure recording in room settings.`,
    );
    return null;
  }

  /**
   * Get recording details
   */
  async getRecording(recordingSid: string): Promise<TwilioRecording | null> {
    try {
      if (!this.client) {
        throw new Error('Twilio client not initialized');
      }

      const recording = await this.client.video.v1.recordings(recordingSid).fetch();

      return {
        sid: recording.sid,
        status: recording.status,
        duration: recording.duration || 0,
        size: recording.size || 0,
        url: recording.links?.media || '',
        dateCreated: recording.dateCreated,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get recording ${recordingSid}: ${error.message}`);
      return null;
    }
  }

  /**
   * Get recordings for a room
   */
  async getRoomRecordings(roomSid: string): Promise<TwilioRecording[]> {
    try {
      if (!this.client) {
        throw new Error('Twilio client not initialized');
      }

      // Use groupingSid to filter recordings by Room SID
      const recordings = await this.client.video.v1.recordings.list({ groupingSid: [roomSid] });

      return recordings.map((recording: any) => ({
        sid: recording.sid,
        roomSid: recording.groupingSids ? recording.groupingSids[0] : roomSid,
        status: recording.status,
        dateCreated: recording.dateCreated,
        duration: recording.duration || 0,
        size: recording.size || 0,
        url: recording.links?.media || '',
      }));
    } catch (error: any) {
      this.logger.error(`Failed to get recordings for room ${roomSid}: ${error.message}`);
      return [];
    }
  }

  /**
   * Delete a recording
   */
  async deleteRecording(recordingSid: string): Promise<boolean> {
    try {
      if (!this.client) {
        throw new Error('Twilio client not initialized');
      }

      await this.client.video.v1.recordings(recordingSid).remove();

      this.logger.log(`Recording ${recordingSid} deleted`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to delete recording ${recordingSid}: ${error.message}`);
      return false;
    }
  }

  /**
   * Check if Twilio Video is configured
   */
  isConfigured(): boolean {
    return !!(this.accountSid && this.authToken && this.apiKeySid && this.apiKeySecret);
  }

  /**
   * Get room composition (for recording/playback)
   */
  async getRoomCompositions(roomSid: string): Promise<any[]> {
    try {
      if (!this.client) {
        throw new Error('Twilio client not initialized');
      }

      const compositions = await this.client.video.v1.compositions.list({ roomSid });

      return compositions.map((c) => ({
        sid: c.sid,
        status: c.status,
        duration: c.duration,
        size: c.size,
        format: c.format,
        url: c.links?.media,
        dateCreated: c.dateCreated,
      }));
    } catch (error: any) {
      this.logger.error(`Failed to get compositions for room ${roomSid}: ${error.message}`);
      return [];
    }
  }
}
