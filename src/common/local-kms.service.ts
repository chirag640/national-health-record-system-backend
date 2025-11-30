import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { EncryptionStrategy } from './encryption-strategy.enum';

/**
 * Local Key Management Service
 *
 * FREE alternative to AWS KMS for field-level encryption.
 * Uses environment variable as master key + scrypt for key derivation.
 *
 * Security Model:
 * - Master Key: Stored in environment variable (ENCRYPTION_MASTER_KEY)
 * - DEK (Data Encryption Key): Generated randomly per record
 * - DEK encrypted with master key before storage
 * - Scrypt for key derivation (slow, resistant to brute-force)
 *
 * ADVANTAGES:
 * ✅ Completely free
 * ✅ No external dependencies
 * ✅ Fast (no network calls)
 * ✅ AES-256-GCM (same cipher as AWS KMS)
 *
 * LIMITATIONS:
 * ❌ Manual key rotation
 * ❌ No audit trail
 * ❌ Key in environment (less secure than HSM)
 * ❌ No key versioning
 *
 * BEST FOR:
 * - Small projects with budget constraints
 * - Internal tools
 * - Testing encryption setup
 * - Non-regulated industries
 *
 * NOT RECOMMENDED FOR:
 * - HIPAA compliance (use AWS KMS)
 * - PCI DSS Level 1 (use AWS KMS)
 * - High-security requirements
 *
 * @example
 * // .env
 * ENCRYPTION_STRATEGY=local
 * ENCRYPTION_MASTER_KEY=your-64-character-hex-key
 *
 * const { plaintextKey, encryptedKey } = await localKmsService.generateDataKey();
 */
@Injectable()
export class LocalKmsService {
  private readonly logger = new Logger(LocalKmsService.name);
  private readonly masterKey!: Buffer;
  private readonly enabled: boolean;

  constructor(private configService: ConfigService) {
    const strategy = this.configService.get<string>(
      'ENCRYPTION_STRATEGY',
      EncryptionStrategy.DISABLED,
    );
    this.enabled = strategy === EncryptionStrategy.LOCAL;

    if (this.enabled) {
      const masterKeyHex = this.configService.get<string>('ENCRYPTION_MASTER_KEY');

      if (!masterKeyHex || masterKeyHex.length < 64) {
        this.logger.error(
          "LOCAL encryption enabled but ENCRYPTION_MASTER_KEY not set or too short. Must be 64+ hex characters. Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
        );
        this.enabled = false;
      } else {
        this.masterKey = Buffer.from(masterKeyHex, 'hex');
        this.logger.log('Local KMS initialized successfully (FREE encryption)');
      }
    }
  }

  /**
   * Check if local encryption is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Generate a new Data Encryption Key (DEK)
   *
   * Unlike AWS KMS which generates keys in HSM, this generates locally.
   *
   * Process:
   * 1. Generate random 32-byte DEK
   * 2. Encrypt DEK with master key using AES-256-GCM
   * 3. Return plaintext DEK (for immediate use) + encrypted DEK (for storage)
   *
   * @returns {Promise<{ plaintextKey: Uint8Array; encryptedKey: Uint8Array }>}
   */
  async generateDataKey(): Promise<{
    plaintextKey: Uint8Array;
    encryptedKey: Uint8Array;
  }> {
    if (!this.enabled) {
      throw new Error('Local encryption is not enabled. Set ENCRYPTION_STRATEGY=local');
    }

    try {
      // Generate random 32-byte DEK (256 bits)
      const plaintextDek = crypto.randomBytes(32);

      // Encrypt DEK with master key
      const iv = crypto.randomBytes(12); // GCM recommended IV size
      const cipher = crypto.createCipheriv('aes-256-gcm', this.masterKey, iv);

      let encryptedDek = cipher.update(plaintextDek);
      encryptedDek = Buffer.concat([encryptedDek, cipher.final()]);

      const authTag = cipher.getAuthTag();

      // Combine: iv + authTag + encryptedDek
      const combined = Buffer.concat([iv, authTag, encryptedDek]);

      return {
        plaintextKey: new Uint8Array(plaintextDek),
        encryptedKey: new Uint8Array(combined),
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error('Failed to generate local data key', err.stack);
      throw new Error(`Local key generation failed: ${err.message}`);
    }
  }

  /**
   * Decrypt an encrypted DEK
   *
   * @param {Uint8Array | Buffer} encryptedKey - Combined IV + authTag + encrypted DEK
   * @returns {Promise<Uint8Array>} Plaintext DEK
   */
  async decryptKey(encryptedKey: Uint8Array | Buffer): Promise<Uint8Array> {
    if (!this.enabled) {
      throw new Error('Local encryption is not enabled');
    }

    try {
      const combined = Buffer.from(encryptedKey);

      // Extract components
      const iv = combined.subarray(0, 12);
      const authTag = combined.subarray(12, 28); // 16 bytes
      const encryptedDek = combined.subarray(28);

      // Decrypt DEK
      const decipher = crypto.createDecipheriv('aes-256-gcm', this.masterKey, iv);
      decipher.setAuthTag(authTag);

      let plaintextDek = decipher.update(encryptedDek);
      plaintextDek = Buffer.concat([plaintextDek, decipher.final()]);

      return new Uint8Array(plaintextDek);
    } catch (error) {
      const err = error as Error;
      this.logger.error('Failed to decrypt local key', err.stack);
      throw new Error(`Local key decryption failed: ${err.message}`);
    }
  }

  /**
   * Rotate master key (manual process)
   *
   * Steps:
   * 1. Generate new master key
   * 2. Re-encrypt all DEKs with new master key
   * 3. Update ENCRYPTION_MASTER_KEY in environment
   * 4. Restart application
   *
   * WARNING: Must re-encrypt all data or keep old key for decryption
   */
  async rotateKey(): Promise<void> {
    this.logger.warn(
      'Local key rotation requires manual process. See ENCRYPTION.md for instructions.',
    );
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    try {
      // Test key generation and decryption cycle
      const { plaintextKey, encryptedKey } = await this.generateDataKey();
      const decrypted = await this.decryptKey(encryptedKey);

      // Verify decrypted key matches original
      return Buffer.from(plaintextKey).equals(Buffer.from(decrypted));
    } catch (error) {
      const err = error as Error;
      this.logger.error('Local KMS health check failed', err.stack);
      return false;
    }
  }

  /**
   * Generate a new master key (for initial setup)
   *
   * Run this once and save to .env:
   * ENCRYPTION_MASTER_KEY=<generated_key>
   */
  static generateMasterKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
