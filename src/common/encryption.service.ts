import { Injectable, Logger } from '@nestjs/common';
import { KmsService } from './kms.service';
import { encryptAES, decryptAES, encryptJSON, EncryptedData } from './encryption.util';

/**
 * Field-Level Encryption Service
 *
 * Provides automatic encryption/decryption of sensitive fields using KMS + AES-GCM.
 *
 * Architecture:
 * 1. Generate unique DEK per record via KMS
 * 2. Encrypt sensitive fields with AES-256-GCM
 * 3. Store encrypted DEK with record
 * 4. Destroy plaintext DEK from memory
 *
 * Security Benefits:
 * - MongoDB breach → data is unreadable
 * - S3 leak → documents are encrypted
 * - Admin access → cannot read sensitive fields
 * - Tampering detected → authentication tags fail
 *
 * @example
 * const encrypted = await encryptionService.encryptRecord(user, ['healthHistory', 'allergies']);
 * const decrypted = await encryptionService.decryptRecord(encrypted, ['healthHistory', 'allergies']);
 */
@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);

  constructor(private readonly kmsService: KmsService) {}

  /**
   * Check if field-level encryption is enabled
   */
  isEnabled(): boolean {
    return this.kmsService.isEnabled();
  }

  /**
   * Encrypt sensitive fields in a record
   *
   * Process:
   * 1. Generate DEK from KMS
   * 2. Encrypt specified fields
   * 3. Store encrypted DEK in record
   * 4. Remove plaintext fields
   *
   * @param {any} record - Database record to encrypt
   * @param {string[]} sensitiveFields - Field names to encrypt
   * @returns {Promise<any>} Record with encrypted fields
   *
   * @example
   * const user = { name: 'John', healthHistory: 'diabetes', allergies: ['peanuts'] };
   * const encrypted = await encryptionService.encryptRecord(user, ['healthHistory', 'allergies']);
   * // Result: { name: 'John', _encrypted: {...}, _encryptedDek: Buffer }
   */
  async encryptRecord(record: any, sensitiveFields: string[]): Promise<any> {
    if (!this.isEnabled()) {
      this.logger.warn('Encryption disabled. Returning record unchanged.');
      return record;
    }

    if (!sensitiveFields || sensitiveFields.length === 0) {
      return record;
    }

    try {
      // Generate unique DEK for this record
      const { plaintextKey, encryptedKey } = await this.kmsService.generateDataKey();
      const key = Buffer.from(plaintextKey);

      // Encrypt each sensitive field
      const encryptedFields: Record<string, EncryptedData> = {};

      for (const fieldName of sensitiveFields) {
        const value = record[fieldName];

        if (value === undefined || value === null) {
          continue; // Skip undefined/null fields
        }

        try {
          // Encrypt based on field type
          if (typeof value === 'string') {
            encryptedFields[fieldName] = encryptAES(value, key);
          } else if (typeof value === 'object') {
            // Encrypt arrays/objects as JSON
            encryptedFields[fieldName] = encryptJSON(value, key);
          } else {
            // Convert primitives to string
            encryptedFields[fieldName] = encryptAES(String(value), key);
          }

          // Remove plaintext field
          delete record[fieldName];
        } catch (error: any) {
          const err = error as Error;
          this.logger.error(`Failed to encrypt field: ${fieldName}`, err.stack);
          throw new Error(`Encryption failed for field: ${fieldName}`);
        }
      }

      // Store encrypted fields and DEK
      record._encrypted = encryptedFields;
      record._encryptedDek = Buffer.from(encryptedKey);

      // Zero out plaintext key from memory (security best practice)
      key.fill(0);

      return record;
    } catch (error: any) {
      const err = error as Error;
      this.logger.error('Failed to encrypt record', err.stack);
      throw new Error(`Record encryption failed: ${err.message}`);
    }
  }

  /**
   * Decrypt sensitive fields in a record
   *
   * Process:
   * 1. Decrypt DEK using KMS
   * 2. Decrypt encrypted fields
   * 3. Restore plaintext fields
   * 4. Remove encrypted data
   *
   * @param {any} record - Database record with encrypted fields
   * @param {string[]} sensitiveFields - Field names to decrypt
   * @returns {Promise<any>} Record with decrypted fields
   *
   * @example
   * const decrypted = await encryptionService.decryptRecord(encrypted, ['healthHistory', 'allergies']);
   * // Result: { name: 'John', healthHistory: 'diabetes', allergies: ['peanuts'] }
   */
  async decryptRecord(record: any, sensitiveFields: string[]): Promise<any> {
    if (!this.isEnabled()) {
      return record;
    }

    if (!record._encrypted || !record._encryptedDek) {
      // Record is not encrypted
      return record;
    }

    try {
      // Decrypt DEK using KMS
      const plaintextKey = await this.kmsService.decryptKey(record._encryptedDek);
      const key = Buffer.from(plaintextKey);

      const encryptedFields = record._encrypted;

      // Decrypt each field
      for (const fieldName of sensitiveFields) {
        const encryptedData = encryptedFields[fieldName];

        if (!encryptedData) {
          continue; // Field not encrypted
        }

        try {
          // Decrypt based on original field type (detect from encrypted structure)
          const decrypted = decryptAES(encryptedData, key);

          // Try to parse as JSON (for objects/arrays)
          try {
            record[fieldName] = JSON.parse(decrypted);
          } catch {
            // Not JSON, use as string
            record[fieldName] = decrypted;
          }
        } catch (error: any) {
          const err = error as Error;
          this.logger.error(`Failed to decrypt field: ${fieldName}`, err.stack);
          throw new Error(
            `Decryption failed for field: ${fieldName}. Data may be corrupted or tampered.`,
          );
        }
      }

      // Remove encrypted metadata
      delete record._encrypted;
      delete record._encryptedDek;

      // Zero out plaintext key from memory
      key.fill(0);

      return record;
    } catch (error: any) {
      const err = error as Error;
      this.logger.error('Failed to decrypt record', err.stack);
      throw new Error(`Record decryption failed: ${err.message}`);
    }
  }

  /**
   * Encrypt an array of records (batch operation)
   *
   * @param {any[]} records - Array of records to encrypt
   * @param {string[]} sensitiveFields - Fields to encrypt
   * @returns {Promise<any[]>} Encrypted records
   */
  async encryptRecords(records: any[], sensitiveFields: string[]): Promise<any[]> {
    if (!this.isEnabled() || !records || records.length === 0) {
      return records;
    }

    return Promise.all(records.map((record) => this.encryptRecord(record, sensitiveFields)));
  }

  /**
   * Decrypt an array of records (batch operation)
   *
   * @param {any[]} records - Array of encrypted records
   * @param {string[]} sensitiveFields - Fields to decrypt
   * @returns {Promise<any[]>} Decrypted records
   */
  async decryptRecords(records: any[], sensitiveFields: string[]): Promise<any[]> {
    if (!this.isEnabled() || !records || records.length === 0) {
      return records;
    }

    return Promise.all(records.map((record) => this.decryptRecord(record, sensitiveFields)));
  }

  /**
   * Detect sensitive field names automatically
   *
   * Flags fields containing:
   * - health, medical, diagnosis, prescription
   * - ssn, tax, salary, income
   * - password, secret, token
   * - credit, card, bank, account
   *
   * @param {any} record - Record to analyze
   * @returns {string[]} Detected sensitive field names
   *
   * @example
   * const fields = encryptionService.detectSensitiveFields({
   *   name: 'John',
   *   healthHistory: 'diabetes',
   *   email: 'john@example.com'
   * });
   * // Returns: ['healthHistory']
   */
  detectSensitiveFields(record: any): string[] {
    const sensitivePatterns = [
      // Medical
      'health',
      'medical',
      'diagnosis',
      'prescription',
      'allergy',
      'medication',
      'symptom',
      'treatment',
      'condition',
      'disease',
      'illness',

      // Financial
      'ssn',
      'tax',
      'salary',
      'income',
      'wage',
      'credit',
      'card',
      'bank',
      'account',

      // Security
      'password',
      'secret',
      'token',
      'key',
      'auth',
      'credential',

      // Personal
      'dob',
      'birthdate',
      'birth',
      'age',
      'address',
      'phone',
    ];

    const sensitiveFields: string[] = [];

    for (const fieldName of Object.keys(record)) {
      const lowerFieldName = fieldName.toLowerCase();

      // Check if field name matches sensitive patterns
      for (const pattern of sensitivePatterns) {
        if (lowerFieldName.includes(pattern)) {
          sensitiveFields.push(fieldName);
          break;
        }
      }
    }

    return sensitiveFields;
  }

  /**
   * Validate encrypted record integrity
   *
   * Checks:
   * - Encrypted DEK exists
   * - Encrypted fields exist
   * - DEK is valid Buffer
   *
   * @param {any} record - Record to validate
   * @returns {boolean} True if record is properly encrypted
   */
  validateEncryption(record: any): boolean {
    if (!record._encrypted || !record._encryptedDek) {
      return false;
    }

    if (!Buffer.isBuffer(record._encryptedDek)) {
      return false;
    }

    if (typeof record._encrypted !== 'object') {
      return false;
    }

    return true;
  }

  /**
   * Health check for encryption system
   *
   * Tests:
   * - KMS connectivity
   * - Encryption/decryption cycle
   *
   * @returns {Promise<boolean>} True if encryption is working
   */
  async healthCheck(): Promise<boolean> {
    if (!this.isEnabled()) {
      return false;
    }

    try {
      // Test KMS connectivity
      const kmsHealth = await this.kmsService.healthCheck();
      if (!kmsHealth) {
        return false;
      }

      // Test encryption cycle
      const testRecord = { testField: 'test data' };
      const encrypted = await this.encryptRecord({ ...testRecord }, ['testField']);
      const decrypted = await this.decryptRecord(encrypted, ['testField']);

      return decrypted.testField === 'test data';
    } catch (error: any) {
      const err = error as Error;
      this.logger.error('Encryption health check failed', err.stack);
      return false;
    }
  }
}
