/**
 * Input Sanitization Utility
 * Prevents NoSQL injection attacks by removing dangerous operators
 *
 * @see https://owasp.org/www-community/attacks/NoSQL_Injection
 */

/**
 * Sanitizes user input to prevent NoSQL injection
 * Removes MongoDB operators like $ne, $gt, $where, etc.
 *
 * @param input - Any user input value
 * @returns Sanitized value safe for database queries
 *
 * @example
 * // Malicious input: { $ne: "" }
 * // Sanitized output: "[object Object]"
 * const email = sanitize(req.body.email);
 */
export function sanitize<T>(input: T): T {
  if (input === null || input === undefined) {
    return input;
  }

  // If input is an object or array, recursively sanitize
  if (typeof input === 'object') {
    if (Array.isArray(input)) {
      return input.map((item) => sanitize(item)) as T;
    }

    // Check if it's a plain object (not Date, RegExp, etc.)
    if (Object.prototype.toString.call(input) === '[object Object]') {
      const sanitized: any = {};

      for (const [key, value] of Object.entries(input)) {
        // Remove keys starting with $ (MongoDB operators)
        if (!key.startsWith('$')) {
          sanitized[key] = sanitize(value);
        }
      }

      return sanitized as T;
    }
  }

  return input;
}

/**
 * Type-safe sanitization for string inputs
 * Ensures the input is a primitive string, not an object
 *
 * @param input - String input to sanitize
 * @returns Sanitized string or empty string if input is an object
 *
 * @example
 * sanitizeString({ $ne: "" }) // Returns ""
 * sanitizeString("user@example.com") // Returns "user@example.com"
 */
export function sanitizeString(input: any): string {
  if (typeof input === 'string') {
    return input;
  }

  // If it's an object or array, return empty string (rejects injection attempts)
  if (typeof input === 'object') {
    return '';
  }

  // Convert primitive types to string
  return String(input);
}

/**
 * Validates and sanitizes MongoDB ObjectId
 * Ensures the input is a valid 24-character hex string
 *
 * @param id - ID string to validate
 * @returns Valid ID or null if invalid
 */
export function sanitizeObjectId(id: any): string | null {
  if (typeof id !== 'string') {
    return null;
  }

  // MongoDB ObjectId is 24 hex characters
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;

  return objectIdRegex.test(id) ? id : null;
}
