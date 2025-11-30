import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { Session, SessionDocument } from './schemas/session.schema';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    @InjectModel(Session.name)
    private sessionModel: Model<SessionDocument>,
  ) {}

  /**
   * Create a new session with refresh token
   */
  async createSession(
    userId: string,
    refreshToken: string,
    expiresAt: Date,
    ipAddress?: string,
    userAgent?: string,
    deviceInfo?: string,
  ): Promise<string> {
    const sessionId = crypto.randomUUID();
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const family = crypto.randomUUID();

    await this.sessionModel.create({
      sessionId,
      userId: new Types.ObjectId(userId),
      refreshTokenHash,
      family,
      expiresAt,
      ipAddress,
      userAgent,
      deviceInfo,
    });

    this.logger.log(`Session created for user ${userId}: ${sessionId}`);
    return sessionId;
  }

  /**
   * Verify refresh token and return session
   */
  async verifyRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<{ valid: boolean; session?: SessionDocument }> {
    const sessions = await this.sessionModel
      .find({
        userId: new Types.ObjectId(userId),
        isRevoked: false,
        expiresAt: { $gt: new Date() },
      })
      .sort({ createdAt: -1 });

    for (const session of sessions) {
      const isMatch = await bcrypt.compare(refreshToken, session.refreshTokenHash);

      if (isMatch) {
        // Update last used time
        session.lastUsedAt = new Date();
        await session.save();

        return { valid: true, session };
      }
    }

    // Check for token reuse attack
    const revokedSessions = await this.sessionModel.find({
      userId: new Types.ObjectId(userId),
      isRevoked: true,
    });

    for (const session of revokedSessions) {
      const isMatch = await bcrypt.compare(refreshToken, session.refreshTokenHash);

      if (isMatch) {
        // SECURITY ALERT: Token reuse detected!
        this.logger.error(`TOKEN REUSE DETECTED for user ${userId}. Revoking all sessions.`);
        await this.revokeAllUserSessions(userId);

        throw new UnauthorizedException({
          code: 'TOKEN_REUSE_DETECTED',
          message: 'Security violation detected. All sessions have been terminated.',
        });
      }
    }

    return { valid: false };
  }

  /**
   * Rotate refresh token (issue new token in same family)
   */
  async rotateRefreshToken(
    oldSessionId: string,
    newRefreshToken: string,
    expiresAt: Date,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<string> {
    const oldSession = await this.sessionModel.findOne({ sessionId: oldSessionId });

    if (!oldSession) {
      throw new UnauthorizedException('Invalid session');
    }

    // Revoke old session
    oldSession.isRevoked = true;
    oldSession.revokedAt = new Date();
    await oldSession.save();

    // Create new session in same family
    const newSessionId = crypto.randomUUID();
    const refreshTokenHash = await bcrypt.hash(newRefreshToken, 10);

    await this.sessionModel.create({
      sessionId: newSessionId,
      userId: oldSession.userId,
      refreshTokenHash,
      family: oldSession.family, // Keep same family for rotation tracking
      expiresAt,
      ipAddress,
      userAgent,
      deviceInfo: oldSession.deviceInfo,
    });

    this.logger.log(`Session rotated: ${oldSessionId} → ${newSessionId}`);
    return newSessionId;
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(sessionId: string): Promise<void> {
    const session = await this.sessionModel.findOne({ sessionId });

    if (session && !session.isRevoked) {
      session.isRevoked = true;
      session.revokedAt = new Date();
      await session.save();

      this.logger.log(`Session revoked: ${sessionId}`);
    }
  }

  /**
   * Revoke all sessions for a user
   */
  async revokeAllUserSessions(userId: string): Promise<number> {
    const result = await this.sessionModel.updateMany(
      { userId: new Types.ObjectId(userId), isRevoked: false },
      { isRevoked: true, revokedAt: new Date() },
    );

    this.logger.log(`Revoked ${result.modifiedCount} sessions for user ${userId}`);
    return result.modifiedCount || 0;
  }

  /**
   * Get active sessions for a user
   */
  async getUserSessions(userId: string): Promise<SessionDocument[]> {
    return this.sessionModel
      .find({
        userId: new Types.ObjectId(userId),
        isRevoked: false,
        expiresAt: { $gt: new Date() },
      })
      .sort({ lastUsedAt: -1 });
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.sessionModel.deleteMany({
      expiresAt: { $lt: new Date() },
    });

    this.logger.log(`Cleaned up ${result.deletedCount} expired sessions`);
    return result.deletedCount || 0;
  }

  /**
   * Get session by ID
   */
  async getSessionById(sessionId: string): Promise<SessionDocument | null> {
    return this.sessionModel.findOne({ sessionId, isRevoked: false });
  }
}
