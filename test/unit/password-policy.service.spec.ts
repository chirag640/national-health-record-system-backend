import { PasswordPolicyService } from '../../src/common/security/password-policy.service';

describe('PasswordPolicyService', () => {
  let service: PasswordPolicyService;

  beforeEach(() => {
    service = new PasswordPolicyService();
  });

  describe('validate', () => {
    it('should accept a strong password', () => {
      const result = service.validate('MySecurePass123!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password shorter than minimum length', () => {
      const result = service.validate('Short1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 12 characters long');
    });

    it('should reject password without uppercase', () => {
      const result = service.validate('mysecurepass123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject password without lowercase', () => {
      const result = service.validate('MYSECUREPASS123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject password without numbers', () => {
      const result = service.validate('MySecurePassword!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should reject password without special characters', () => {
      const result = service.validate('MySecurePass1234');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should reject common passwords', () => {
      const result = service.validate('Password123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password is too common. Please choose a more unique password',
      );
    });

    it('should reject passwords with sequential characters', () => {
      const result = service.validate('MyPass123456!aa');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password contains sequential characters');
    });

    it('should reject passwords with repeated characters', () => {
      const result = service.validate('MyPasswooord1!a');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password contains too many repeated characters');
    });

    it('should reject passwords with keyboard patterns', () => {
      const result = service.validate('Qwerty12345678!');
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('common patterns'))).toBe(true);
    });
  });

  describe('validateWithEmail', () => {
    it('should reject password similar to email', () => {
      const result = service.validateWithEmail('TestUser123!abc', 'testuser@example.com');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password should not be similar to your email');
    });

    it('should accept password not similar to email', () => {
      const result = service.validateWithEmail('SecurePass789!@', 'john@example.com');
      expect(result.isValid).toBe(true);
    });
  });

  describe('getStrength', () => {
    it('should return "very-weak" for weak passwords', () => {
      const strength = service.getStrength('abc');
      expect(strength.label).toBe('very-weak');
      expect(strength.score).toBeLessThan(30);
    });

    it('should return "weak" for slightly better passwords', () => {
      const strength = service.getStrength('password1');
      expect(strength.label).toBe('weak');
    });

    it('should return "strong" or "very-strong" for good passwords', () => {
      const strength = service.getStrength('MyVerySecureP@ssw0rd!');
      expect(['strong', 'very-strong']).toContain(strength.label);
      expect(strength.score).toBeGreaterThan(60);
    });
  });

  describe('generateSecurePassword', () => {
    it('should generate password of specified length', () => {
      const password = service.generateSecurePassword(16);
      expect(password).toHaveLength(16);
    });

    it('should generate valid password by default', () => {
      const password = service.generateSecurePassword();
      const result = service.validate(password);
      expect(result.isValid).toBe(true);
    });

    it('should generate unique passwords', () => {
      const passwords = new Set<string>();
      for (let i = 0; i < 10; i++) {
        passwords.add(service.generateSecurePassword());
      }
      expect(passwords.size).toBe(10);
    });
  });
});
