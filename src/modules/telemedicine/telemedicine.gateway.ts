import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { TelemedicineSessionRepository } from './telemedicine-session.repository';
import { ParticipantStatus } from './schemas/telemedicine-session.schema';

interface ChatMessage {
  sessionId: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date;
}

interface JoinRoomMessage {
  sessionId: string;
  userId: string;
  userName: string;
}

interface ConnectionQualityMessage {
  sessionId: string;
  userId: string;
  quality: string;
}

@WebSocketGateway({
  cors: {
    origin: '*', // Configure appropriately for production
  },
  namespace: '/telemedicine',
})
export class TelemedicineGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TelemedicineGateway.name);
  private connectedUsers: Map<string, string> = new Map(); // socketId -> userId

  constructor(private readonly sessionRepository: TelemedicineSessionRepository) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    const userId = this.connectedUsers.get(client.id);
    if (userId) {
      this.connectedUsers.delete(client.id);

      // Find sessions where user is a participant and update status
      const rooms = Array.from(client.rooms).filter((room) => room !== client.id);
      for (const sessionId of rooms) {
        try {
          await this.sessionRepository.updateParticipantStatus(
            sessionId,
            userId,
            ParticipantStatus.DISCONNECTED,
          );

          // Notify other participants
          client.to(sessionId).emit('participant_disconnected', {
            userId,
            timestamp: new Date(),
          });

          // Increment disconnection count
          await this.sessionRepository.update(sessionId, {
            'metrics.disconnectionCount': 1,
          } as any);
        } catch (error: any) {
          this.logger.error(`Error handling disconnect for session ${sessionId}: ${error.message}`);
        }
      }
    }
  }

  @SubscribeMessage('join_session')
  async handleJoinSession(@MessageBody() data: JoinRoomMessage, @ConnectedSocket() client: Socket) {
    try {
      const { sessionId, userId, userName } = data;

      // Join the room
      await client.join(sessionId);

      // Store user connection
      this.connectedUsers.set(client.id, userId);

      // Update participant status
      await this.sessionRepository.updateParticipantStatus(
        sessionId,
        userId,
        ParticipantStatus.JOINED,
      );

      // Notify other participants
      client.to(sessionId).emit('participant_joined', {
        userId,
        userName,
        timestamp: new Date(),
      });

      // Send system message
      const systemMessage = {
        sessionId,
        senderId: 'system',
        senderName: 'System',
        message: `${userName} joined the session`,
        timestamp: new Date(),
        isSystemMessage: true,
      };

      await this.sessionRepository.addChatMessage(sessionId, systemMessage);
      this.server.to(sessionId).emit('chat_message', systemMessage);

      this.logger.log(`User ${userId} joined session ${sessionId}`);

      return { success: true, message: 'Joined session successfully' };
    } catch (error: any) {
      this.logger.error(`Error joining session: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  @SubscribeMessage('leave_session')
  async handleLeaveSession(
    @MessageBody() data: { sessionId: string; userId: string; userName: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { sessionId, userId, userName } = data;

      // Update participant status
      await this.sessionRepository.updateParticipantStatus(
        sessionId,
        userId,
        ParticipantStatus.LEFT,
      );

      // Leave the room
      await client.leave(sessionId);

      // Remove from connected users
      this.connectedUsers.delete(client.id);

      // Notify other participants
      client.to(sessionId).emit('participant_left', {
        userId,
        userName,
        timestamp: new Date(),
      });

      // Send system message
      const systemMessage = {
        sessionId,
        senderId: 'system',
        senderName: 'System',
        message: `${userName} left the session`,
        timestamp: new Date(),
        isSystemMessage: true,
      };

      await this.sessionRepository.addChatMessage(sessionId, systemMessage);
      this.server.to(sessionId).emit('chat_message', systemMessage);

      this.logger.log(`User ${userId} left session ${sessionId}`);

      return { success: true, message: 'Left session successfully' };
    } catch (error: any) {
      this.logger.error(`Error leaving session: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  @SubscribeMessage('send_message')
  async handleChatMessage(@MessageBody() data: ChatMessage, @ConnectedSocket() _client: Socket) {
    try {
      const { sessionId, senderId, senderName, message } = data;

      const chatMessage = {
        sessionId,
        senderId,
        senderName,
        message,
        timestamp: new Date(),
        isSystemMessage: false,
      };

      // Save to database
      await this.sessionRepository.addChatMessage(sessionId, chatMessage);

      // Broadcast to all participants in the session
      this.server.to(sessionId).emit('chat_message', chatMessage);

      this.logger.log(`Chat message sent in session ${sessionId} by ${senderId}`);

      return { success: true, message: 'Message sent successfully' };
    } catch (error: any) {
      this.logger.error(`Error sending message: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @MessageBody() data: { sessionId: string; userId: string; userName: string; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const { sessionId, userId, userName, isTyping } = data;

    // Broadcast typing indicator to other participants
    client.to(sessionId).emit('user_typing', {
      userId,
      userName,
      isTyping,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('update_connection_quality')
  async handleConnectionQuality(
    @MessageBody() data: ConnectionQualityMessage,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { sessionId, userId, quality } = data;

      // Update participant connection quality
      await this.sessionRepository.updateParticipantStatus(sessionId, userId, undefined, {
        connectionQuality: quality,
      });

      // Notify other participants (especially doctor/moderator)
      client.to(sessionId).emit('connection_quality_update', {
        userId,
        quality,
        timestamp: new Date(),
      });

      return { success: true };
    } catch (error: any) {
      this.logger.error(`Error updating connection quality: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  @SubscribeMessage('toggle_audio')
  async handleToggleAudio(
    @MessageBody() data: { sessionId: string; userId: string; muted: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { sessionId, userId, muted } = data;

      // Update participant audio status
      await this.sessionRepository.updateParticipantStatus(sessionId, userId, undefined, {
        microphoneMuted: muted,
      });

      // Notify other participants
      client.to(sessionId).emit('audio_status_changed', {
        userId,
        muted,
        timestamp: new Date(),
      });

      return { success: true };
    } catch (error: any) {
      this.logger.error(`Error toggling audio: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  @SubscribeMessage('toggle_video')
  async handleToggleVideo(
    @MessageBody() data: { sessionId: string; userId: string; disabled: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { sessionId, userId, disabled } = data;

      // Update participant video status
      await this.sessionRepository.updateParticipantStatus(sessionId, userId, undefined, {
        videoDisabled: disabled,
      });

      // Notify other participants
      client.to(sessionId).emit('video_status_changed', {
        userId,
        disabled,
        timestamp: new Date(),
      });

      return { success: true };
    } catch (error: any) {
      this.logger.error(`Error toggling video: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  @SubscribeMessage('report_issue')
  async handleReportIssue(
    @MessageBody() data: { sessionId: string; userId: string; issue: string },
    @ConnectedSocket() _client: Socket,
  ) {
    try {
      const { sessionId, issue } = data;

      // Add to technical issues array
      const session = await this.sessionRepository.findById(sessionId);
      if (session) {
        const technicalIssues = session.metrics?.technicalIssues || [];
        technicalIssues.push(`${new Date().toISOString()}: ${issue}`);

        await this.sessionRepository.update(sessionId, {
          'metrics.technicalIssues': technicalIssues,
        } as any);
      }

      this.logger.warn(`Technical issue reported for session ${sessionId}: ${issue}`);

      return { success: true, message: 'Issue reported' };
    } catch (error: any) {
      this.logger.error(`Error reporting issue: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  // Helper method to send notification to specific user
  sendToUser(userId: string, event: string, data: any) {
    // Find socket by userId
    for (const [socketId, connectedUserId] of this.connectedUsers.entries()) {
      if (connectedUserId === userId) {
        this.server.to(socketId).emit(event, data);
        break;
      }
    }
  }

  // Helper method to send notification to all participants in a session
  sendToSession(sessionId: string, event: string, data: any) {
    this.server.to(sessionId).emit(event, data);
  }
}
