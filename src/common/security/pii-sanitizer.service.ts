import { Injectable } from '@nestjs/common';

/**
 * PII Sanitizer Service
 * Sanitizes Personally Identifiable Information from logs and error messages
 * Essential for HIPAA/PHI compliance
 */
@Injectable()
export class PIISanitizerService {
  // Patterns for common PII types
  private readonly patterns = {
    // Email addresses
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,

    // Phone numbers (Indian format)
    phoneIndian: /(\+91[\-\s]?)?[0]?(91)?[789]\d{9}/g,

    // Phone numbers (International)
    phoneInternational: /\+?[\d\s\-().]{10,}/g,

    // Aadhaar number (Indian ID)
    aadhaar: /\d{4}[\s-]?\d{4}[\s-]?\d{4}/g,

    // PAN card (Indian)
    pan: /[A-Z]{5}\d{4}[A-Z]/g,

    // Credit card numbers
    creditCard: /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/g,

    // IP addresses
    ipv4: /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g,
    ipv6: /([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}/g,

    // JWT tokens
    jwt: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,

    // MongoDB ObjectIds
    objectId: /[a-f0-9]{24}/gi,

    // Dates of birth (common formats)
    dateOfBirth: /\b\d{2}[-/]\d{2}[-/]\d{4}\b|\b\d{4}[-/]\d{2}[-/]\d{2}\b/g,

    // Patient IDs (NHRS format)
    patientId: /NHRS-\d{4}-[A-Z0-9]+/g,

    // Medical record numbers
    mrn: /MRN[-:]?\s*\d{6,}/gi,
  };

  // Fields that should always be sanitized
  private readonly sensitiveFields = new Set([
    'password',
    'passwordHash',
    'token',
    'accessToken',
    'refreshToken',
    'secret',
    'apiKey',
    'authorization',
    'cookie',
    'ssn',
    'aadhaar',
    'pan',
    'creditCard',
    'cvv',
    'otp',
    'pin',
  ]);

  /**
   * Sanitize a string by replacing PII with masked values
   */
  sanitizeString(input: string): string {
    if (!input || typeof input !== 'string') {
      return input;
    }

    let sanitized = input;

    // Replace emails
    sanitized = sanitized.replace(this.patterns.email, '[EMAIL_REDACTED]');

    // Replace phone numbers
    sanitized = sanitized.replace(this.patterns.phoneIndian, '[PHONE_REDACTED]');
    sanitized = sanitized.replace(this.patterns.phoneInternational, '[PHONE_REDACTED]');

    // Replace Aadhaar
    sanitized = sanitized.replace(this.patterns.aadhaar, '[AADHAAR_REDACTED]');

    // Replace PAN
    sanitized = sanitized.replace(this.patterns.pan, '[PAN_REDACTED]');

    // Replace credit cards
    sanitized = sanitized.replace(this.patterns.creditCard, '[CARD_REDACTED]');

    // Replace IPs
    sanitized = sanitized.replace(this.patterns.ipv4, '[IP_REDACTED]');
    sanitized = sanitized.replace(this.patterns.ipv6, '[IP_REDACTED]');

    // Replace JWTs
    sanitized = sanitized.replace(this.patterns.jwt, '[JWT_REDACTED]');

    // Replace patient IDs (partial mask)
    sanitized = sanitized.replace(this.patterns.patientId, (match) => {
      return match.substring(0, 9) + '***';
    });

    return sanitized;
  }

  /**
   * Sanitize an object by recursively processing all string values
   */
  sanitizeObject<T extends Record<string, any>>(obj: T, depth = 0): T {
    if (depth > 10) {
      return obj;
    } // Prevent infinite recursion
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const sanitized: any = Array.isArray(obj) ? [] : {};

    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();

      // Completely redact sensitive fields
      if (this.sensitiveFields.has(lowerKey)) {
        sanitized[key] = '[REDACTED]';
        continue;
      }

      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map((item) =>
          typeof item === 'object'
            ? this.sanitizeObject(item, depth + 1)
            : typeof item === 'string'
              ? this.sanitizeString(item)
              : item,
        );
      } else if (value && typeof value === 'object') {
        sanitized[key] = this.sanitizeObject(value, depth + 1);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Create a sanitized copy of an error for logging
   */
  sanitizeError(error: Error): Record<string, any> {
    return {
      name: error.name,
      message: this.sanitizeString(error.message),
      stack: error.stack ? this.sanitizeString(error.stack) : undefined,
    };
  }

  /**
   * Mask a value partially (show first/last N characters)
   */
  partialMask(value: string, showFirst = 2, showLast = 2): string {
    if (!value || value.length <= showFirst + showLast) {
      return '*'.repeat(value?.length || 0);
    }
    const firstPart = value.substring(0, showFirst);
    const lastPart = value.substring(value.length - showLast);
    const masked = '*'.repeat(value.length - showFirst - showLast);
    return `${firstPart}${masked}${lastPart}`;
  }

  /**
   * Mask email address
   */
  maskEmail(email: string): string {
    if (!email || !email.includes('@')) {
      return '[INVALID_EMAIL]';
    }
    const [local, domain] = email.split('@');
    if (!local || !domain) {
      return '[INVALID_EMAIL]';
    }
    const maskedLocal = this.partialMask(local, 2, 0);
    return `${maskedLocal}@${domain}`;
  }

  /**
   * Mask phone number
   */
  maskPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 6) {
      return '[INVALID_PHONE]';
    }
    return `***${digits.slice(-4)}`;
  }
}
