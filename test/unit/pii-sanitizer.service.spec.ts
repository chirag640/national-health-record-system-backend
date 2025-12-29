import { PIISanitizerService } from '../../src/common/security/pii-sanitizer.service';

describe('PIISanitizerService', () => {
  let service: PIISanitizerService;

  beforeEach(() => {
    service = new PIISanitizerService();
  });

  describe('sanitizeString', () => {
    it('should mask email addresses', () => {
      const input = 'Contact us at john.doe@example.com for more info';
      const result = service.sanitizeString(input);
      expect(result).not.toContain('john.doe@example.com');
      expect(result).toContain('[EMAIL REDACTED]');
    });

    it('should mask Indian phone numbers', () => {
      const input = 'Call +919876543210 for support';
      const result = service.sanitizeString(input);
      expect(result).not.toContain('+919876543210');
      expect(result).toContain('[PHONE REDACTED]');
    });

    it('should mask Aadhaar numbers', () => {
      const input = 'Aadhaar: 1234 5678 9012';
      const result = service.sanitizeString(input);
      expect(result).not.toContain('1234 5678 9012');
      expect(result).toContain('[AADHAAR REDACTED]');
    });

    it('should mask PAN numbers', () => {
      const input = 'PAN: ABCDE1234F';
      const result = service.sanitizeString(input);
      expect(result).not.toContain('ABCDE1234F');
      expect(result).toContain('[PAN REDACTED]');
    });

    it('should mask credit card numbers', () => {
      const input = 'Card: 4111111111111111';
      const result = service.sanitizeString(input);
      expect(result).not.toContain('4111111111111111');
      expect(result).toContain('[CREDIT_CARD REDACTED]');
    });

    it('should mask JWT tokens', () => {
      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      const input = `Token: ${token}`;
      const result = service.sanitizeString(input);
      expect(result).not.toContain(token);
      expect(result).toContain('[JWT REDACTED]');
    });

    it('should handle strings without PII', () => {
      const input = 'This is a normal message without any PII';
      const result = service.sanitizeString(input);
      expect(result).toBe(input);
    });

    it('should handle empty strings', () => {
      expect(service.sanitizeString('')).toBe('');
    });

    it('should handle null/undefined gracefully', () => {
      expect(service.sanitizeString(null as any)).toBe('');
      expect(service.sanitizeString(undefined as any)).toBe('');
    });
  });

  describe('sanitizeObject', () => {
    it('should redact sensitive fields by name', () => {
      const input = {
        email: 'test@example.com',
        password: 'secret123',
        data: 'normal data',
      };
      const result = service.sanitizeObject(input);
      expect(result.password).toBe('[REDACTED]');
      expect(result.data).toBe('normal data');
    });

    it('should sanitize nested objects', () => {
      const input = {
        user: {
          email: 'test@example.com',
          profile: {
            phone: '+919876543210',
          },
        },
      };
      const result = service.sanitizeObject(input) as any;
      expect(result.user.profile.phone).toContain('[PHONE REDACTED]');
    });

    it('should sanitize arrays', () => {
      const input = {
        emails: ['john@example.com', 'jane@example.com'],
      };
      const result = service.sanitizeObject(input) as any;
      expect(result.emails[0]).toContain('[EMAIL REDACTED]');
      expect(result.emails[1]).toContain('[EMAIL REDACTED]');
    });

    it('should handle circular references gracefully', () => {
      const obj: any = { name: 'test' };
      obj.self = obj;
      // Should not throw
      expect(() => service.sanitizeObject(obj)).not.toThrow();
    });

    it('should preserve non-sensitive data', () => {
      const input = {
        id: '123',
        status: 'active',
        count: 42,
        isValid: true,
      };
      const result = service.sanitizeObject(input);
      expect(result).toEqual(input);
    });
  });

  describe('maskEmail', () => {
    it('should partially mask email addresses', () => {
      const result = service.maskEmail('john.doe@example.com');
      expect(result).toMatch(/^j\*+@example\.com$/);
    });

    it('should handle short email local parts', () => {
      const result = service.maskEmail('ab@example.com');
      expect(result).toContain('@example.com');
    });
  });

  describe('maskPhone', () => {
    it('should partially mask phone numbers', () => {
      const result = service.maskPhone('+919876543210');
      expect(result).toMatch(/^\+91\*+3210$/);
    });

    it('should handle shorter phone numbers', () => {
      const result = service.maskPhone('1234567890');
      expect(result.length).toBeLessThanOrEqual(10);
    });
  });
});
