import * as crypto from 'crypto';

/**
 * AES-256-GCM Encryption Utilities
 *
 * Provides secure field-level encryption using AES-256-GCM with:
 * - 256-bit encryption keys
 * - Random initialization vectors (IV) per encryption
 * - Authentication tags for integrity checking
 * - Protection against tampering
 *
 * Used by: Stripe, WhatsApp, PayPal, Healthcare systems
 */

/**
 * Encrypted data structure with integrity protection
 */
export interface EncryptedData {
  ciphertext: string; // Base64 encoded encrypted data
  iv: string; // Base64 encoded initialization vector
  tag: string; // Base64 encoded authentication tag (prevents tampering)
}

/**
 * Encrypt plaintext using AES-256-GCM
 *
 * Features:
 * - AES-256-GCM cipher (industry standard)
 * - Random 12-byte IV for each encryption
 * - Authentication tag prevents tampering
 * - Base64 encoding for storage
 *
 * @param {string} plaintext - Data to encrypt
 * @param {Buffer} key - 32-byte encryption key (from KMS DEK)
 * @returns {EncryptedData} Encrypted data with IV and auth tag
 * @throws {Error} If encryption fails
 *
 * @example
 * const key = Buffer.from(plaintextKey);
 * const encrypted = encryptAES('sensitive medical data', key);
 * // Store: encrypted.ciphertext, encrypted.iv, encrypted.tag
 */
export function encryptAES(plaintext: string, key: Buffer): EncryptedData {
  if (!plaintext) {
    throw new Error('Cannot encrypt empty plaintext');
  }

  if (!key || key.length !== 32) {
    throw new Error('Encryption key must be 32 bytes (256 bits)');
  }

  try {
    // Generate random 12-byte IV (recommended for GCM)
    const iv = crypto.randomBytes(12);

    // Create AES-256-GCM cipher
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    // Encrypt data
    let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
    ciphertext += cipher.final('base64');

    // Get authentication tag (prevents tampering)
    const authTag = cipher.getAuthTag();

    return {
      ciphertext,
      iv: iv.toString('base64'),
      tag: authTag.toString('base64'),
    };
  } catch (error: any) {
    const err = error as Error;
    throw new Error(`Encryption failed: ${err.message}`);
  }
}

/**
 * Decrypt ciphertext using AES-256-GCM
 *
 * Features:
 * - Verifies authentication tag (detects tampering)
 * - Throws error if data was modified
 * - Returns original plaintext
 *
 * @param {EncryptedData} data - Encrypted data with IV and tag
 * @param {Buffer} key - 32-byte decryption key (same as encryption key)
 * @returns {string} Original plaintext
 * @throws {Error} If decryption fails or data was tampered with
 *
 * @example
 * const key = Buffer.from(await kmsService.decryptKey(record.encryptedDek));
 * const plaintext = decryptAES(record.encryptedField, key);
 */
export function decryptAES(data: EncryptedData, key: Buffer): string {
  if (!data || !data.ciphertext || !data.iv || !data.tag) {
    throw new Error('Invalid encrypted data structure');
  }

  if (!key || key.length !== 32) {
    throw new Error('Decryption key must be 32 bytes (256 bits)');
  }

  try {
    // Parse IV and auth tag from base64
    const iv = Buffer.from(data.iv, 'base64');
    const authTag = Buffer.from(data.tag, 'base64');

    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);

    // Set authentication tag (will verify during decryption)
    decipher.setAuthTag(authTag);

    // Decrypt data
    let plaintext = decipher.update(data.ciphertext, 'base64', 'utf8');
    plaintext += decipher.final('utf8');

    return plaintext;
  } catch (error: any) {
    const err = error as Error;
    // Auth tag mismatch means data was tampered with
    if (err.message.includes('Unsupported state or unable to authenticate data')) {
      throw new Error('Data integrity check failed. Data may have been tampered with.');
    }
    throw new Error(`Decryption failed: ${err.message}`);
  }
}

/**
 * Encrypt a JSON object (for complex fields like arrays, objects)
 *
 * @param {any} obj - Object to encrypt
 * @param {Buffer} key - Encryption key
 * @returns {EncryptedData} Encrypted JSON
 */
export function encryptJSON(obj: any, key: Buffer): EncryptedData {
  const jsonString = JSON.stringify(obj);
  return encryptAES(jsonString, key);
}

/**
 * Decrypt and parse JSON object
 *
 * @param {EncryptedData} data - Encrypted JSON
 * @param {Buffer} key - Decryption key
 * @returns {any} Parsed object
 */
export function decryptJSON(data: EncryptedData, key: Buffer): any {
  const jsonString = decryptAES(data, key);
  return JSON.parse(jsonString);
}

/**
 * Generate a random encryption key (for testing purposes only)
 * DO NOT use this for production - use KMS generateDataKey() instead
 *
 * @returns {Buffer} 32-byte random key
 */
export function generateTestKey(): Buffer {
  return crypto.randomBytes(32);
}

/**
 * Securely compare two buffers in constant time (prevents timing attacks)
 *
 * @param {Buffer} a - First buffer
 * @param {Buffer} b - Second buffer
 * @returns {boolean} True if buffers are equal
 */
export function secureCompare(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}
