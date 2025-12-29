import { InputSanitizer } from '../../src/common/validation/validation.pipe';

describe('InputSanitizer', () => {
  describe('sanitizeString', () => {
    it('should remove null bytes', () => {
      const input = 'hello\0world';
      expect(InputSanitizer.sanitizeString(input)).toBe('helloworld');
    });

    it('should remove control characters', () => {
      const input = 'hello\x0Bworld';
      expect(InputSanitizer.sanitizeString(input)).toBe('helloworld');
    });

    it('should trim whitespace', () => {
      const input = '  hello world  ';
      expect(InputSanitizer.sanitizeString(input)).toBe('hello world');
    });

    it('should handle normal strings unchanged', () => {
      const input = 'Hello World!';
      expect(InputSanitizer.sanitizeString(input)).toBe('Hello World!');
    });

    it('should handle empty strings', () => {
      expect(InputSanitizer.sanitizeString('')).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(InputSanitizer.sanitizeString(null as any)).toBeNull();
      expect(InputSanitizer.sanitizeString(undefined as any)).toBeUndefined();
    });
  });

  describe('sanitizeNoSQLInput', () => {
    it('should remove $ operators from strings', () => {
      const input = '$ne';
      expect(InputSanitizer.sanitizeNoSQLInput(input)).toBe('ne');
    });

    it('should remove $ keys from objects', () => {
      const input = { $gt: 100, name: 'test' };
      const result = InputSanitizer.sanitizeNoSQLInput(input);
      expect(result).not.toHaveProperty('$gt');
      expect(result).toHaveProperty('name', 'test');
    });

    it('should sanitize nested objects', () => {
      const input = {
        query: { $where: 'malicious code' },
        data: { name: 'John' },
      };
      const result = InputSanitizer.sanitizeNoSQLInput(input);
      expect(result.query).not.toHaveProperty('$where');
      expect(result.data.name).toBe('John');
    });

    it('should sanitize arrays', () => {
      const input = ['$gt', 'normal'];
      const result = InputSanitizer.sanitizeNoSQLInput(input);
      expect(result[0]).toBe('gt');
      expect(result[1]).toBe('normal');
    });
  });

  describe('sanitizeHTML', () => {
    it('should escape HTML entities', () => {
      const input = '<script>alert("xss")</script>';
      const result = InputSanitizer.sanitizeHTML(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });

    it('should escape quotes', () => {
      const input = 'Hello "World" & \'Friends\'';
      const result = InputSanitizer.sanitizeHTML(input);
      expect(result).not.toContain('"');
      expect(result).not.toContain("'");
    });

    it('should handle normal text unchanged', () => {
      const input = 'Hello World';
      expect(InputSanitizer.sanitizeHTML(input)).toBe('Hello World');
    });
  });

  describe('sanitizeEmail', () => {
    it('should lowercase email', () => {
      expect(InputSanitizer.sanitizeEmail('John.Doe@Example.COM')).toBe('john.doe@example.com');
    });

    it('should trim whitespace', () => {
      expect(InputSanitizer.sanitizeEmail('  john@example.com  ')).toBe('john@example.com');
    });
  });

  describe('sanitizePhone', () => {
    it('should keep only digits and +', () => {
      expect(InputSanitizer.sanitizePhone('+91 (987) 654-3210')).toBe('+919876543210');
    });

    it('should remove all non-numeric characters except +', () => {
      expect(InputSanitizer.sanitizePhone('Call: 123-456-7890')).toBe('1234567890');
    });
  });

  describe('sanitizeFileName', () => {
    it('should remove path traversal characters', () => {
      expect(InputSanitizer.sanitizeFileName('../../../etc/passwd')).toBe('etcpasswd');
    });

    it('should remove dangerous characters', () => {
      expect(InputSanitizer.sanitizeFileName('file<name>:with|bad?chars*')).toBe(
        'filenamewithbadchars',
      );
    });

    it('should replace spaces with underscores', () => {
      expect(InputSanitizer.sanitizeFileName('my file name.pdf')).toBe('my_file_name.pdf');
    });
  });

  describe('sanitizeURL', () => {
    it('should accept valid http URLs', () => {
      expect(InputSanitizer.sanitizeURL('http://example.com')).toBe('http://example.com/');
    });

    it('should accept valid https URLs', () => {
      expect(InputSanitizer.sanitizeURL('https://example.com/path?query=1')).toBe(
        'https://example.com/path?query=1',
      );
    });

    it('should reject javascript URLs', () => {
      expect(InputSanitizer.sanitizeURL('javascript:alert(1)')).toBeNull();
    });

    it('should reject file URLs', () => {
      expect(InputSanitizer.sanitizeURL('file:///etc/passwd')).toBeNull();
    });

    it('should reject invalid URLs', () => {
      expect(InputSanitizer.sanitizeURL('not a url')).toBeNull();
    });
  });

  describe('sanitizeObject', () => {
    it('should deep sanitize objects', () => {
      const input = {
        name: '  John Doe  ',
        nested: {
          value: 'test\0data',
        },
        array: ['  item1  ', '  item2  '],
      };

      const result = InputSanitizer.sanitizeObject(input);
      expect(result.name).toBe('John Doe');
      expect(result.nested.value).toBe('testdata');
      expect(result.array[0]).toBe('item1');
    });

    it('should handle null/undefined in objects', () => {
      const input = {
        valid: 'data',
        nullValue: null,
        undefinedValue: undefined,
      };

      const result = InputSanitizer.sanitizeObject(input);
      expect(result.valid).toBe('data');
      expect(result.nullValue).toBeNull();
      expect(result.undefinedValue).toBeUndefined();
    });

    it('should preserve numbers and booleans', () => {
      const input = {
        count: 42,
        isActive: true,
        score: 3.14,
      };

      const result = InputSanitizer.sanitizeObject(input);
      expect(result).toEqual(input);
    });
  });
});
