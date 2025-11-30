/**
 * Encryption Strategy Types
 *
 * Controls how field-level encryption works in your application.
 * Choose based on your budget, compliance requirements, and data sensitivity.
 */
export enum EncryptionStrategy {
  /**
   * DISABLED - No encryption
   *
   * Use when:
   * - Non-sensitive data only
   * - Internal tools
   * - Development/testing
   *
   * Cost: FREE
   * Security: ❌ None
   * Compliance: ❌ Not suitable for PII/medical data
   */
  DISABLED = 'disabled',

  /**
   * LOCAL - AES-256-GCM with environment variable key
   *
   * Use when:
   * - Budget constraints
   * - Small projects
   * - Self-managed encryption
   * - Testing encryption setup
   *
   * Cost: FREE
   * Security: ✅ Strong (if key managed properly)
   * Compliance: ⚠️  Acceptable for some regulations (depends on key storage)
   *
   * Limitations:
   * - Manual key rotation required
   * - No key versioning
   * - Key stored in environment (less secure than HSM)
   * - No audit trail
   */
  LOCAL = 'local',

  /**
   * AWS_KMS - AWS Key Management Service
   *
   * Use when:
   * - Medical/healthcare data (HIPAA)
   * - Financial data (PCI DSS)
   * - Enterprise applications
   * - Compliance required
   *
   * Cost: $1/month + $0.03 per 10,000 requests (~$7/month for 1M records)
   * Security: ✅✅✅ Bank-grade (Hardware Security Module)
   * Compliance: ✅ HIPAA, GDPR, PCI DSS compliant
   *
   * Benefits:
   * - Automatic key rotation
   * - CloudTrail audit logs
   * - Multi-region support
   * - Key versioning
   * - No key stored on server
   */
  AWS_KMS = 'aws_kms',

  /**
   * FUTURE: Google Cloud KMS, Azure Key Vault, HashiCorp Vault
   * Can be added as needed
   */
}

/**
 * Encryption configuration interface
 */
export interface EncryptionConfig {
  strategy: EncryptionStrategy;
  enabled: boolean;

  // Local encryption settings (for LOCAL strategy)
  localMasterKey?: string;

  // AWS KMS settings (for AWS_KMS strategy)
  awsRegion?: string;
  kmsKeyId?: string;
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
}
