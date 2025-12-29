import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';

/**
 * Enhanced Validation Pipe with detailed error messages and PII sanitization
 */
@Injectable()
export class EnhancedValidationPipe implements PipeTransform<any> {
  async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
    const { metatype } = metadata;

    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype, value, {
      enableImplicitConversion: true,
      excludeExtraneousValues: false,
    });

    const errors = await validate(object, {
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      validationError: { target: false, value: false },
    });

    if (errors.length > 0) {
      const formattedErrors = this.formatErrors(errors);
      throw new BadRequestException({
        message: 'Validation failed',
        errors: formattedErrors,
      });
    }

    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private formatErrors(errors: ValidationError[], parentPath = ''): Record<string, string[]> {
    const result: Record<string, string[]> = {};

    for (const error of errors) {
      const path = parentPath ? `${parentPath}.${error.property}` : error.property;

      if (error.constraints) {
        result[path] = Object.values(error.constraints);
      }

      if (error.children && error.children.length > 0) {
        const childErrors = this.formatErrors(error.children, path);
        Object.assign(result, childErrors);
      }
    }

    return result;
  }
}

/**
 * Sanitization utility functions for input data
 */
export class InputSanitizer {
  /**
   * Sanitize string input - remove dangerous characters
   */
  static sanitizeString(input: string): string {
    if (!input || typeof input !== 'string') {
      return input;
    }

    return (
      input
        // Remove null bytes
        .replace(/\0/g, '')
        // Remove control characters except whitespace
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        // Trim whitespace
        .trim()
    );
  }

  /**
   * Sanitize for SQL injection (additional layer)
   */
  static sanitizeSQLInput(input: string): string {
    if (!input || typeof input !== 'string') {
      return input;
    }

    // MongoDB uses NoSQL, but we sanitize for defense in depth
    return input
      .replace(/'/g, "''")
      .replace(/;/g, '')
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '');
  }

  /**
   * Sanitize for NoSQL injection (MongoDB specific)
   */
  static sanitizeNoSQLInput(input: any): any {
    if (typeof input === 'string') {
      // Remove MongoDB operators
      return input.replace(/\$/g, '').replace(/\./g, '').trim();
    }

    if (Array.isArray(input)) {
      return input.map((item) => InputSanitizer.sanitizeNoSQLInput(item));
    }

    if (input && typeof input === 'object') {
      const sanitized: Record<string, any> = {};
      for (const [key, value] of Object.entries(input)) {
        // Remove keys starting with $ (MongoDB operators)
        if (!key.startsWith('$')) {
          sanitized[InputSanitizer.sanitizeNoSQLInput(key)] =
            InputSanitizer.sanitizeNoSQLInput(value);
        }
      }
      return sanitized;
    }

    return input;
  }

  /**
   * Sanitize HTML to prevent XSS
   */
  static sanitizeHTML(input: string): string {
    if (!input || typeof input !== 'string') {
      return input;
    }

    const htmlEntities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
      '`': '&#96;',
      '=': '&#x3D;',
    };

    return input.replace(/[&<>"'`=/]/g, (char) => htmlEntities[char] || char);
  }

  /**
   * Sanitize email address
   */
  static sanitizeEmail(email: string): string {
    if (!email || typeof email !== 'string') {
      return email;
    }

    return email.toLowerCase().trim();
  }

  /**
   * Sanitize phone number (keep only digits and +)
   */
  static sanitizePhone(phone: string): string {
    if (!phone || typeof phone !== 'string') {
      return phone;
    }

    return phone.replace(/[^\d+]/g, '');
  }

  /**
   * Sanitize file name
   */
  static sanitizeFileName(fileName: string): string {
    if (!fileName || typeof fileName !== 'string') {
      return fileName;
    }

    return (
      fileName
        // Remove path traversal characters
        .replace(/\.\./g, '')
        .replace(/[\/\\]/g, '')
        // Remove dangerous characters
        .replace(/[<>:"|?*]/g, '')
        // Replace spaces with underscores
        .replace(/\s+/g, '_')
        .trim()
    );
  }

  /**
   * Sanitize URL
   */
  static sanitizeURL(url: string): string | null {
    if (!url || typeof url !== 'string') {
      return null;
    }

    try {
      const parsed = new URL(url);
      // Only allow http and https
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return null;
      }
      return parsed.toString();
    } catch {
      return null;
    }
  }

  /**
   * Deep sanitize object
   */
  static sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return InputSanitizer.sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => InputSanitizer.sanitizeObject(item));
    }

    if (typeof obj === 'object') {
      const sanitized: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        const sanitizedKey = InputSanitizer.sanitizeString(key);
        sanitized[sanitizedKey] = InputSanitizer.sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  }
}

/**
 * Input sanitization interceptor
 */
import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class InputSanitizationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // Sanitize body
    if (request.body) {
      request.body = InputSanitizer.sanitizeNoSQLInput(request.body);
    }

    // Sanitize query params
    if (request.query) {
      request.query = InputSanitizer.sanitizeNoSQLInput(request.query);
    }

    // Sanitize URL params
    if (request.params) {
      request.params = InputSanitizer.sanitizeNoSQLInput(request.params);
    }

    return next.handle();
  }
}

/**
 * MongoDB ObjectId validation pipe
 */
@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!value) {
      throw new BadRequestException('ObjectId is required');
    }

    // MongoDB ObjectId regex
    const objectIdRegex = /^[a-fA-F0-9]{24}$/;

    if (!objectIdRegex.test(value)) {
      throw new BadRequestException('Invalid ObjectId format');
    }

    return value;
  }
}

/**
 * UUID validation pipe
 */
@Injectable()
export class ParseUUIDPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!value) {
      throw new BadRequestException('UUID is required');
    }

    // UUID v4 regex
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(value)) {
      throw new BadRequestException('Invalid UUID format');
    }

    return value.toLowerCase();
  }
}
