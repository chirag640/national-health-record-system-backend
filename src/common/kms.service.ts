import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KMSClient, GenerateDataKeyCommand, DecryptCommand } from '@aws-sdk/client-kms';
import { EncryptionStrategy } from './encryption-strategy.enum';
import { LocalKmsService } from './local-kms.service';

/**
 * Unified KMS Service - Supports multiple encryption strategies
 *
 * Strategies:
 * 1. DISABLED - No encryption (free, no security)
 * 2. LOCAL - Free AES-256 with env key (good for small projects)
 * 3. AWS_KMS - Paid AWS KMS ($7/month, enterprise-grade, HIPAA compliant)
 *
 * Automatically delegates to the correct implementation based on ENCRYPTION_STRATEGY.
 *
 * Configuration:
 * ```
 * # Option 1: Disabled (default)
 * ENCRYPTION_STRATEGY=disabled
 *
 * # Option 2: Local/Free
 * ENCRYPTION_STRATEGY=local
 * ENCRYPTION_MASTER_KEY=<64-char-hex-key>
 *
 * # Option 3: AWS KMS (Paid)
 * ENCRYPTION_STRATEGY=aws_kms
 * KMS_KEY_ID=arn:aws:kms:...
 * AWS_REGION=us-east-1
 * ```
 *
 * @example
 * const { plaintextKey, encryptedKey } = await kmsService.generateDataKey();
 * // Works with ANY strategy configured
 */
@Injectable()
export class KmsService {
  private readonly logger = new Logger(KmsService.name);
  private kmsClient!: KMSClient;
  private readonly kmsKeyId!: string;
  private readonly enabled: boolean;
  private readonly strategy: EncryptionStrategy;

  constructor(
    private configService: ConfigService,
    private localKmsService: LocalKmsService,
  ) {
    // Read encryption strategy from config
    this.strategy = this.configService.get<EncryptionStrategy>(
      'ENCRYPTION_STRATEGY',
      EncryptionStrategy.DISABLED,
    );

    this.enabled = this.strategy !== EncryptionStrategy.DISABLED;

    if (this.strategy === EncryptionStrategy.AWS_KMS) {
      // Initialize AWS KMS
      const region = this.configService.get<string>('AWS_REGION');
      this.kmsKeyId = this.configService.get<string>('KMS_KEY_ID') || '';

      if (!region || !this.kmsKeyId) {
        this.logger.error(
          'AWS KMS strategy selected but AWS_REGION or KMS_KEY_ID not configured. Encryption will be disabled.',
        );
        this.enabled = false;
      } else {
        this.kmsClient = new KMSClient({ region });
        this.logger.log('✅ AWS KMS Service initialized (Paid, Enterprise-grade)');
      }
    } else if (this.strategy === EncryptionStrategy.LOCAL) {
      if (this.localKmsService.isEnabled()) {
        this.logger.log('✅ Local KMS initialized (FREE, Good for small projects)');
      } else {
        this.enabled = false;
        this.logger.error('LOCAL strategy selected but ENCRYPTION_MASTER_KEY not configured');
      }
    } else {
      this.logger.warn(
        '⚠️  Field-level encryption DISABLED. Set ENCRYPTION_STRATEGY=local or aws_kms to enable.',
      );
    }
  }

  /**
   * Get current encryption strategy
   */
  getStrategy(): EncryptionStrategy {
    return this.strategy;
  }

  /**
   * Check if encryption is enabled (any strategy)
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Generate a new Data Encryption Key (DEK) for field-level encryption
   *
   * Automatically uses the configured strategy (LOCAL or AWS_KMS).
   *
   * Returns both:
   * - Plaintext key: Use this to encrypt data (DO NOT STORE)
   * - Encrypted key: Store this in the database with the record
   *
   * @returns {Promise<{ plaintextKey: Uint8Array; encryptedKey: Uint8Array }>}
   * @throws {Error} If encryption is not enabled or key generation fails
   *
   * @example
   * const { plaintextKey, encryptedKey } = await kmsService.generateDataKey();
   * const encrypted = encryptAES(sensitiveData, Buffer.from(plaintextKey));
   * record.encryptedDek = Buffer.from(encryptedKey);
   */
  async generateDataKey(): Promise<{
    plaintextKey: Uint8Array;
    encryptedKey: Uint8Array;
  }> {
    if (!this.enabled) {
      throw new Error(
        `Encryption is not enabled. Set ENCRYPTION_STRATEGY=local or aws_kms. Current: ${this.strategy}`,
      );
    }

    // Delegate to appropriate implementation
    if (this.strategy === EncryptionStrategy.LOCAL) {
      return this.localKmsService.generateDataKey();
    }

    // AWS KMS implementation
    try {
      const command = new GenerateDataKeyCommand({
        KeyId: this.kmsKeyId,
        KeySpec: 'AES_256', // 256-bit AES key
      });

      const response = await this.kmsClient.send(command);

      if (!response.Plaintext || !response.CiphertextBlob) {
        throw new Error('AWS KMS failed to generate data key');
      }

      return {
        plaintextKey: response.Plaintext,
        encryptedKey: response.CiphertextBlob,
      };
    } catch (error: any) {
      const err = error as Error;
      this.logger.error('Failed to generate data key from AWS KMS', err.stack);
      throw new Error(`AWS KMS key generation failed: ${err.message}`);
    }
  }

  /**
   * Decrypt an encrypted DEK to get the plaintext key for decryption
   *
   * Automatically uses the configured strategy (LOCAL or AWS_KMS).
   *
   * @param {Uint8Array | Buffer} encryptedKey - The encrypted DEK stored in database
   * @returns {Promise<Uint8Array>} Plaintext DEK for decryption
   * @throws {Error} If decryption fails or key is invalid
   *
   * @example
   * const plaintextKey = await kmsService.decryptKey(record.encryptedDek);
   * const decrypted = decryptAES(record.encryptedFields, Buffer.from(plaintextKey));
   */
  async decryptKey(encryptedKey: Uint8Array | Buffer): Promise<Uint8Array> {
    if (!this.enabled) {
      throw new Error('Encryption is not enabled');
    }

    // Delegate to appropriate implementation
    if (this.strategy === EncryptionStrategy.LOCAL) {
      return this.localKmsService.decryptKey(encryptedKey);
    }

    // AWS KMS implementation
    try {
      const command = new DecryptCommand({
        CiphertextBlob:
          encryptedKey instanceof Buffer ? new Uint8Array(encryptedKey) : encryptedKey,
      });

      const response = await this.kmsClient.send(command);

      if (!response.Plaintext) {
        throw new Error('AWS KMS failed to decrypt key');
      }

      return response.Plaintext;
    } catch (error: any) {
      const err = error as Error;
      this.logger.error('Failed to decrypt key with AWS KMS', err.stack);
      throw new Error(`AWS KMS decryption failed: ${err.message}`);
    }
  }

  /**
   * Rotate the master KMS key (should be done every 90 days)
   *
   * Note: This is typically handled automatically by AWS KMS key rotation policy.
   * This method is for manual rotation or auditing purposes.
   *
   * @returns {Promise<void>}
   */
  async rotateKey(): Promise<void> {
    if (!this.enabled) {
      throw new Error('KMS encryption is not enabled');
    }

    this.logger.warn(
      'Key rotation should be configured in AWS KMS console for automatic rotation every 90 days',
    );
    // Manual rotation logic can be added here if needed
  }

  /**
   * Health check for encryption system
   *
   * @returns {Promise<boolean>} True if encryption is working
   */
  async healthCheck(): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    try {
      if (this.strategy === EncryptionStrategy.LOCAL) {
        return this.localKmsService.healthCheck();
      }

      // Test AWS KMS connectivity by generating a test key
      await this.generateDataKey();
      return true;
    } catch (error: any) {
      const err = error as Error;
      this.logger.error('Encryption health check failed', err.stack);
      return false;
    }
  }

  /**
   * Get strategy info for debugging/monitoring
   */
  getInfo(): {
    strategy: EncryptionStrategy;
    enabled: boolean;
    provider: string;
    cost: string;
  } {
    const strategyInfo = {
      [EncryptionStrategy.DISABLED]: {
        provider: 'None',
        cost: 'FREE (No encryption)',
      },
      [EncryptionStrategy.LOCAL]: {
        provider: 'Local AES-256-GCM',
        cost: 'FREE',
      },
      [EncryptionStrategy.AWS_KMS]: {
        provider: 'AWS Key Management Service',
        cost: '~$7/month for 1M records',
      },
    };

    return {
      strategy: this.strategy,
      enabled: this.enabled,
      ...strategyInfo[this.strategy],
    };
  }
}
