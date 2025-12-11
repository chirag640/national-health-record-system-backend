import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

/**
 * WebSocket Gateway for Real-Time Notifications
 *
 * Handles:
 * - User connection/disconnection
 * - Room-based subscriptions
 * - Real-time event broadcasting
 * - Authentication via JWT
 */
@WebSocketGateway({
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private connectedUsers = new Map<string, string>(); // socketId -> userId

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Initialize WebSocket server
   */
  afterInit(_server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  /**
   * Handle client connection
   */
  async handleConnection(client: Socket) {
    try {
      // Extract and verify JWT token from handshake
      const token =
        client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        this.logger.warn(`Connection rejected: No token provided`);
        client.disconnect();
        return;
      }

      // Verify JWT
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const userId = payload.sub || payload._id;

      if (!userId) {
        this.logger.warn(`Connection rejected: Invalid token payload`);
        client.disconnect();
        return;
      }

      // Store user connection
      this.connectedUsers.set(client.id, userId);

      // Join user-specific room
      const userRoom = `user:${userId}`;
      await client.join(userRoom);

      // Join role-based room
      const roleRoom = `role:${payload.role}`;
      await client.join(roleRoom);

      this.logger.log(`Client connected: ${client.id} (User: ${userId}, Role: ${payload.role})`);

      // Send connection success
      client.emit('connected', {
        userId,
        message: 'Successfully connected to notification service',
        timestamp: new Date(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Connection error: ${message}`);
      client.disconnect();
    }
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket) {
    const userId = this.connectedUsers.get(client.id);

    if (userId) {
      this.connectedUsers.delete(client.id);
      this.logger.log(`Client disconnected: ${client.id} (User: ${userId})`);
    } else {
      this.logger.log(`Client disconnected: ${client.id}`);
    }
  }

  /**
   * Subscribe to specific notification types
   */
  @SubscribeMessage('subscribe')
  async handleSubscribe(client: Socket, data: { types: string[] }) {
    const userId = this.connectedUsers.get(client.id);

    if (!userId) {
      return { error: 'Unauthorized' };
    }

    // Join notification type rooms
    await Promise.all(data.types.map((type) => client.join(`type:${type}`)));

    this.logger.log(`User ${userId} subscribed to: ${data.types.join(', ')}`);

    return {
      success: true,
      subscribed: data.types,
      message: 'Successfully subscribed to notification types',
    };
  }

  /**
   * Unsubscribe from notification types
   */
  @SubscribeMessage('unsubscribe')
  async handleUnsubscribe(client: Socket, data: { types: string[] }) {
    const userId = this.connectedUsers.get(client.id);

    if (!userId) {
      return { error: 'Unauthorized' };
    }

    // Leave notification type rooms
    await Promise.all(data.types.map((type) => client.leave(`type:${type}`)));

    this.logger.log(`User ${userId} unsubscribed from: ${data.types.join(', ')}`);

    return {
      success: true,
      unsubscribed: data.types,
      message: 'Successfully unsubscribed from notification types',
    };
  }

  /**
   * Send notification to specific user
   */
  sendToUser(userId: string, event: string, data: any) {
    const userRoom = `user:${userId}`;
    this.server.to(userRoom).emit(event, {
      ...data,
      timestamp: new Date(),
    });

    this.logger.debug(`Sent ${event} to user ${userId}`);
  }

  /**
   * Send notification to users with specific role
   */
  sendToRole(role: string, event: string, data: any) {
    const roleRoom = `role:${role}`;
    this.server.to(roleRoom).emit(event, {
      ...data,
      timestamp: new Date(),
    });

    this.logger.debug(`Sent ${event} to role ${role}`);
  }

  /**
   * Send notification to subscribers of specific type
   */
  sendToType(type: string, event: string, data: any) {
    const typeRoom = `type:${type}`;
    this.server.to(typeRoom).emit(event, {
      ...data,
      timestamp: new Date(),
    });

    this.logger.debug(`Sent ${event} to type ${type}`);
  }

  /**
   * Broadcast to all connected clients
   */
  broadcast(event: string, data: any) {
    this.server.emit(event, {
      ...data,
      timestamp: new Date(),
    });

    this.logger.debug(`Broadcast ${event} to all clients`);
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      connectedClients: this.connectedUsers.size,
      connectedUsers: Array.from(new Set(this.connectedUsers.values())).length,
    };
  }
}
