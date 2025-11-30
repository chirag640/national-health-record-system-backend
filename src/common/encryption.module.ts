import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KmsService } from './kms.service';
import { LocalKmsService } from './local-kms.service';
import { EncryptionService } from './encryption.service';

/**
 * Encryption Module - Supports Multiple Strategies
 *
 * Choose your encryption strategy based on budget and compliance needs:
 *
 * 1. DISABLED (default)
 *    - FREE, No encryption
 *    - For non-sensitive data only
 *
 * 2. LOCAL (free alternative)
 *    - FREE, AES-256-GCM with environment variable key
 *    - Good for small projects, internal tools
 *    - Config: ENCRYPTION_STRATEGY=local, ENCRYPTION_MASTER_KEY=<64-char-hex>
 *
 * 3. AWS_KMS (enterprise-grade)
 *    - ~$7/month, HIPAA/GDPR compliant
 *    - Automatic key rotation, audit logs
 *    - Config: ENCRYPTION_STRATEGY=aws_kms, KMS_KEY_ID=<arn>, AWS_REGION=<region>
 *
 * Usage:
 * 1. Import EncryptionModule (already global)
 * 2. Inject EncryptionService in your services
 * 3. Call encryptRecord() before saving
 * 4. Call decryptRecord() after reading
 *
 * @example
 * // In your service
 * constructor(private encryptionService: EncryptionService) {}
 *
 * async create(data) {
 *   const encrypted = await this.encryptionService.encryptRecord(
 *     data,
 *     ['healthHistory', 'allergies']
 *   );
 *   return this.repository.save(encrypted);
 * }
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [LocalKmsService, KmsService, EncryptionService],
  exports: [KmsService, EncryptionService],
})
export class EncryptionModule {}
