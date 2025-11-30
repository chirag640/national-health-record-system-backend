import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { RefreshToken, RefreshTokenDocument } from './refresh-token.schema';

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectModel(RefreshToken.name)
    private refreshTokenModel: Model<RefreshTokenDocument>,
  ) {}

  /**
   * Create and store a hashed refresh token with family tracking
   */
  async createRefreshToken(
    userId: string,
    token: string,
    expiresAt: Date,
    ipAddress?: string,
    userAgent?: string,
    family?: string,
  ): Promise<void> {
    // Hash the token before storage (security best practice)
    const tokenHash = await bcrypt.hash(token, 10);

    // Generate family ID if not provided (for token rotation chains)
    const tokenFamily = family || crypto.randomUUID();

    await this.refreshTokenModel.create({
      userId,
      tokenHash,
      family: tokenFamily,
      expiresAt,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Verify refresh token and check for reuse attacks
   */
  async verifyRefreshToken(
    userId: string,
    token: string,
  ): Promise<{ valid: boolean; family?: string }> {
    // Find all tokens for this user
    const userTokens = await this.refreshTokenModel
      .find({ userId, isRevoked: false })
      .sort({ createdAt: -1 })
      .exec();

    // Check each token hash
    for (const storedToken of userTokens) {
      const isMatch = await bcrypt.compare(token, storedToken.tokenHash);

      if (isMatch) {
        // Token found - update last used time
        storedToken.lastUsedAt = new Date();
        await storedToken.save();

        return { valid: true, family: storedToken.family };
      }
    }

    // Token not found - check if it belongs to a revoked family (reuse attack)
    const revokedTokens = await this.refreshTokenModel.find({ userId, isRevoked: true }).exec();

    for (const revokedToken of revokedTokens) {
      const isMatch = await bcrypt.compare(token, revokedToken.tokenHash);

      if (isMatch) {
        // SECURITY: Refresh token reuse detected!
        // Revoke entire token family to prevent further compromise
        await this.revokeTokenFamily(revokedToken.family);

        throw new UnauthorizedException({
          code: 'REFRESH_TOKEN_REUSE_DETECTED',
          message: 'Token reuse detected. All sessions have been terminated for security.',
        });
      }
    }

    return { valid: false };
  }

  /**
   * Revoke a token by hash
   */
  async revokeToken(userId: string, token: string): Promise<void> {
    const userTokens = await this.refreshTokenModel.find({ userId, isRevoked: false }).exec();

    for (const storedToken of userTokens) {
      const isMatch = await bcrypt.compare(token, storedToken.tokenHash);

      if (isMatch) {
        storedToken.isRevoked = true;
        storedToken.revokedAt = new Date();
        await storedToken.save();
        return;
      }
    }
  }

  /**
   * Revoke all tokens in a family (security measure for token reuse)
   */
  async revokeTokenFamily(family: string): Promise<void> {
    await this.refreshTokenModel.updateMany(
      { family, isRevoked: false },
      {
        $set: {
          isRevoked: true,
          revokedAt: new Date(),
        },
      },
    );
  }

  /**
   * Revoke all tokens for a user (logout from all devices)
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenModel.updateMany(
      { userId, isRevoked: false },
      {
        $set: {
          isRevoked: true,
          revokedAt: new Date(),
        },
      },
    );
  }

  /**
   * Clean up expired tokens (run as cron job)
   */
  async cleanupExpiredTokens(): Promise<void> {
    const now = new Date();
    await this.refreshTokenModel.deleteMany({
      expiresAt: { $lt: now },
    });
  }
}
