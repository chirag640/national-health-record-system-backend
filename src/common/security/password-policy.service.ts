import { Injectable, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * Password Policy Service
 * Implements NIST 800-63B password guidelines for healthcare applications
 */
@Injectable()
export class PasswordPolicyService {
  // Common passwords list (top 100 - in production, use a larger list)
  private readonly commonPasswords = new Set([
    'password',
    '123456',
    '12345678',
    'qwerty',
    'abc123',
    'monkey',
    '1234567',
    'letmein',
    'trustno1',
    'dragon',
    'baseball',
    'iloveyou',
    'master',
    'sunshine',
    'ashley',
    'bailey',
    'passw0rd',
    'shadow',
    '123123',
    '654321',
    'superman',
    'qazwsx',
    'michael',
    'football',
    'password1',
    'password123',
    'welcome',
    'jesus',
    'ninja',
    'mustang',
    'password12',
    'admin',
    'login',
    'welcome1',
    'admin123',
    'root',
    'toor',
    'pass',
    'test',
    'guest',
    'master123',
    'changeme',
    'hello',
    'charlie',
    'donald',
    'password2',
    'qwerty123',
    'letmein1',
    '12345',
  ]);

  // Minimum requirements
  private readonly MIN_LENGTH = 12;
  private readonly MAX_LENGTH = 128;
  private readonly MIN_UPPERCASE = 1;
  private readonly MIN_LOWERCASE = 1;
  private readonly MIN_DIGITS = 1;
  private readonly MIN_SPECIAL = 1;

  /**
   * Validate password against security policy
   * @param password - Password to validate
   * @param email - User email to check against
   * @throws BadRequestException if password doesn't meet requirements
   */
  validatePassword(password: string, email?: string): void {
    const errors: string[] = [];

    // Length check
    if (password.length < this.MIN_LENGTH) {
      errors.push(`Password must be at least ${this.MIN_LENGTH} characters long`);
    }
    if (password.length > this.MAX_LENGTH) {
      errors.push(`Password must not exceed ${this.MAX_LENGTH} characters`);
    }

    // Character type checks
    if ((password.match(/[A-Z]/g) || []).length < this.MIN_UPPERCASE) {
      errors.push(`Password must contain at least ${this.MIN_UPPERCASE} uppercase letter(s)`);
    }
    if ((password.match(/[a-z]/g) || []).length < this.MIN_LOWERCASE) {
      errors.push(`Password must contain at least ${this.MIN_LOWERCASE} lowercase letter(s)`);
    }
    if ((password.match(/[0-9]/g) || []).length < this.MIN_DIGITS) {
      errors.push(`Password must contain at least ${this.MIN_DIGITS} digit(s)`);
    }
    if (
      (password.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || []).length < this.MIN_SPECIAL
    ) {
      errors.push(`Password must contain at least ${this.MIN_SPECIAL} special character(s)`);
    }

    // Common password check
    if (this.isCommonPassword(password)) {
      errors.push('This password is too common. Please choose a stronger password');
    }

    // Sequential/repeated characters check
    if (this.hasSequentialChars(password)) {
      errors.push('Password cannot contain more than 3 sequential characters (e.g., 1234, abcd)');
    }
    if (this.hasRepeatedChars(password)) {
      errors.push('Password cannot contain more than 3 repeated characters (e.g., aaaa, 1111)');
    }

    // Email similarity check
    if (email && this.isSimilarToEmail(password, email)) {
      errors.push('Password cannot be similar to your email address');
    }

    // Keyboard pattern check
    if (this.hasKeyboardPattern(password)) {
      errors.push('Password cannot contain keyboard patterns (e.g., qwerty, asdf)');
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        code: 'WEAK_PASSWORD',
        message: 'Password does not meet security requirements',
        errors,
      });
    }
  }

  /**
   * Calculate password strength score (0-100)
   */
  calculateStrength(password: string): number {
    let score = 0;

    // Length scoring
    score += Math.min(password.length * 2, 30);

    // Character variety
    if (/[a-z]/.test(password)) {
      score += 10;
    }
    if (/[A-Z]/.test(password)) {
      score += 10;
    }
    if (/[0-9]/.test(password)) {
      score += 10;
    }
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 15;
    }

    // Bonus for mixed case spread throughout
    const positions = password
      .split('')
      .map((c, i) => ({ char: c, pos: i, isUpper: /[A-Z]/.test(c) }));
    const upperPositions = positions.filter((p) => p.isUpper);
    if (upperPositions.length > 1) {
      const lastUpper = upperPositions[upperPositions.length - 1];
      const firstUpper = upperPositions[0];
      if (lastUpper && firstUpper) {
        const spread = lastUpper.pos - firstUpper.pos;
        if (spread > password.length / 2) {
          score += 10;
        }
      }
    }

    // Penalty for common patterns
    if (this.isCommonPassword(password)) {
      score -= 30;
    }
    if (this.hasSequentialChars(password)) {
      score -= 15;
    }
    if (this.hasRepeatedChars(password)) {
      score -= 15;
    }
    if (this.hasKeyboardPattern(password)) {
      score -= 20;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get password strength label
   */
  getStrengthLabel(score: number): 'weak' | 'fair' | 'good' | 'strong' | 'excellent' {
    if (score < 30) {
      return 'weak';
    }
    if (score < 50) {
      return 'fair';
    }
    if (score < 70) {
      return 'good';
    }
    if (score < 90) {
      return 'strong';
    }
    return 'excellent';
  }

  private isCommonPassword(password: string): boolean {
    const normalized = password.toLowerCase().replace(/[0-9@$!%*?&]/g, '');
    return this.commonPasswords.has(password.toLowerCase()) || this.commonPasswords.has(normalized);
  }

  private hasSequentialChars(password: string, maxSequential = 3): boolean {
    const lower = password.toLowerCase();
    for (let i = 0; i <= lower.length - maxSequential - 1; i++) {
      let sequential = true;
      for (let j = 0; j < maxSequential; j++) {
        if (lower.charCodeAt(i + j + 1) !== lower.charCodeAt(i + j) + 1) {
          sequential = false;
          break;
        }
      }
      if (sequential) {
        return true;
      }
    }
    return false;
  }

  private hasRepeatedChars(password: string, maxRepeated = 3): boolean {
    const regex = new RegExp(`(.)\\1{${maxRepeated},}`, 'i');
    return regex.test(password);
  }

  private isSimilarToEmail(password: string, email: string): boolean {
    const emailParts = email.toLowerCase().split(/[@._-]/);
    const passwordLower = password.toLowerCase();

    for (const part of emailParts) {
      if (part.length >= 4 && passwordLower.includes(part)) {
        return true;
      }
    }
    return false;
  }

  private hasKeyboardPattern(password: string): boolean {
    const patterns = [
      'qwerty',
      'qwertz',
      'azerty',
      'asdf',
      'zxcv',
      'qazwsx',
      '!@#$%',
      '1qaz',
      '2wsx',
      '3edc',
      '4rfv',
      '5tgb',
      '6yhn',
      '7ujm',
      '8ik,',
      '9ol.',
      '0p;/',
    ];

    const lower = password.toLowerCase();
    return patterns.some((pattern) => lower.includes(pattern));
  }

  /**
   * Generate a secure random password
   */
  generateSecurePassword(length = 16): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const all = lowercase + uppercase + digits + special;

    let password = '';
    // Ensure at least one of each required type
    password += lowercase[crypto.randomInt(lowercase.length)];
    password += uppercase[crypto.randomInt(uppercase.length)];
    password += digits[crypto.randomInt(digits.length)];
    password += special[crypto.randomInt(special.length)];

    // Fill rest with random characters
    for (let i = password.length; i < length; i++) {
      password += all[crypto.randomInt(all.length)];
    }

    // Shuffle the password
    return password
      .split('')
      .sort(() => crypto.randomInt(3) - 1)
      .join('');
  }
}
