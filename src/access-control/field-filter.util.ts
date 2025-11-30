import * as _ from 'lodash';
import { getFieldAccessPolicy, canAccessField } from './field-access.policy';

/**
 * Field Filter Utility
 *
 * This is the CORE of FLAC system.
 * Removes unauthorized fields from response objects based on user role.
 *
 * Usage:
 *   const filtered = filterFields('user', workerData, req.user.id);
 *
 * Features:
 * - Deep cloning (doesn't modify original)
 * - Nested field filtering (e.g., "profile.ssn")
 * - Array filtering (e.g., "orders.*.paymentInfo")
 * - Self-only access enforcement
 * - Audit logging for denied access
 */

export interface FilterOptions {
  userId?: string;
  entityName?: string;
  logDenied?: boolean;
  auditLog?: (message: string) => void;
}

/**
 * Filter fields from a resource based on role-based access policy
 *
 * @param role - User's role (e.g., 'user', 'admin', 'doctor')
 * @param resource - The data object to filter
 * @param options - Additional filtering options
 * @returns Filtered resource or null if access denied
 */
export function filterFields(role: string, resource: any, options: FilterOptions = {}): any | null {
  const { userId, logDenied = false, auditLog } = options;

  // Handle null/undefined
  if (!resource) return resource;

  // Get policy for this role
  const policy = getFieldAccessPolicy(role);

  // Check self-only access
  if (policy.allowSelfOnly) {
    const resourceUserId = resource.userId || resource._id || resource.id;
    if (userId && resourceUserId && String(resourceUserId) !== String(userId)) {
      if (logDenied && auditLog) {
        auditLog(
          `Access denied: User ${userId} attempted to access resource ${resourceUserId} (self-only)`,
        );
      }
      return null; // Access denied
    }
  }

  // Deep clone to avoid mutating original
  let result = JSON.parse(JSON.stringify(resource));

  // Collect all field paths in the object
  const allFieldPaths = collectFieldPaths(result);

  // Filter out denied fields
  const deniedFields: string[] = [];

  for (const fieldPath of allFieldPaths) {
    if (!canAccessField(role, fieldPath)) {
      _.unset(result, fieldPath);
      deniedFields.push(fieldPath);
    }
  }

  // Log denied fields for audit
  if (logDenied && deniedFields.length > 0 && auditLog) {
    auditLog(`Fields denied for role ${role}: ${deniedFields.join(', ')}`);
  }

  return result;
}

/**
 * Filter an array of resources
 *
 * @param role - User's role
 * @param resources - Array of data objects
 * @param options - Filtering options
 * @returns Filtered array (null entries removed)
 */
export function filterFieldsArray(
  role: string,
  resources: any[],
  options: FilterOptions = {},
): any[] {
  if (!Array.isArray(resources)) return resources;

  return resources
    .map((resource) => filterFields(role, resource, options))
    .filter((resource) => resource !== null);
}

/**
 * Collect all field paths from an object (including nested)
 *
 * Example:
 *   { user: { profile: { name: 'John', ssn: '123' } } }
 *   → ['user', 'user.profile', 'user.profile.name', 'user.profile.ssn']
 */
function collectFieldPaths(obj: any, prefix = ''): string[] {
  const paths: string[] = [];

  if (typeof obj !== 'object' || obj === null) {
    return paths;
  }

  for (const key of Object.keys(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    paths.push(fullPath);

    if (typeof obj[key] === 'object' && obj[key] !== null) {
      if (Array.isArray(obj[key])) {
        // Handle arrays
        obj[key].forEach((item: any, index: number) => {
          const arrayPath = `${fullPath}[${index}]`;
          paths.push(...collectFieldPaths(item, arrayPath));
        });
      } else {
        // Handle nested objects
        paths.push(...collectFieldPaths(obj[key], fullPath));
      }
    }
  }

  return paths;
}

/**
 * Check if user can perform action on entity
 *
 * @param role - User's role
 * @param entityName - Entity name (e.g., 'Worker', 'Order')
 * @param action - Action type ('read', 'write', 'delete')
 * @returns true if allowed
 */
export function canPerformAction(
  role: string,
  entityName: string,
  action: 'read' | 'write' | 'delete',
): boolean {
  const policy = getFieldAccessPolicy(role);
  const entityRules = policy.entityRules?.[entityName];

  if (!entityRules) {
    // No specific rules, check global policy
    return policy.allow?.includes('*') || false;
  }

  const actionKey = `allow${action.charAt(0).toUpperCase()}${action.slice(1)}` as
    | 'allowRead'
    | 'allowWrite'
    | 'allowDelete';

  return entityRules[actionKey] ?? true; // Default to true if not specified
}

/**
 * Filter fields specifically for API responses
 * Includes additional safety measures
 */
export function filterApiResponse(role: string, data: any, options: FilterOptions = {}): any {
  // Always enable logging for API responses
  const enhancedOptions = {
    ...options,
    logDenied: true,
    auditLog: options.auditLog || ((msg: string) => console.log(`[FLAC] ${msg}`)),
  };

  if (Array.isArray(data)) {
    return filterFieldsArray(role, data, enhancedOptions);
  }

  return filterFields(role, data, enhancedOptions);
}

/**
 * Sanitize sensitive fields by replacing with placeholder
 * Useful for debugging without exposing actual values
 */
export function sanitizeForLogging(obj: any): any {
  const sensitivePatterns = [
    /password/i,
    /secret/i,
    /token/i,
    /key/i,
    /ssn/i,
    /credit.*card/i,
    /api.*key/i,
  ];

  const cloned = JSON.parse(JSON.stringify(obj));

  function sanitizeRecursive(target: any) {
    if (typeof target !== 'object' || target === null) return;

    for (const key of Object.keys(target)) {
      if (sensitivePatterns.some((pattern) => pattern.test(key))) {
        target[key] = '[REDACTED]';
      } else if (typeof target[key] === 'object') {
        sanitizeRecursive(target[key]);
      }
    }
  }

  sanitizeRecursive(cloned);
  return cloned;
}
