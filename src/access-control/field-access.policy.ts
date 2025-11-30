/**
 * Field-Level Access Control Policies
 *
 * Defines which fields each role can access across ALL entities in the system.
 * This works for ANY database (medical, e-commerce, finance, HR, etc.)
 *
 * Policy Structure:
 * - allowSelfOnly: User can only access their own records
 * - allow: Array of allowed field paths (use "*" for all)
 * - deny: Array of denied field paths (overrides allow)
 * - entityRules: Specific rules per entity type
 *
 * Field Path Examples:
 * - "email" → direct field
 * - "profile.ssn" → nested field
 * - "orders.*.paymentInfo" → array nested field
 * - "sensitiveData" → encrypted field object
 */

export interface FieldAccessRule {
  allowSelfOnly?: boolean;
  allow?: string[];
  deny?: string[];
  entityRules?: Record<
    string,
    {
      allow?: string[];
      deny?: string[];
      allowRead?: boolean;
      allowWrite?: boolean;
      allowDelete?: boolean;
    }
  >;
}

/**
 * Default Field Access Policies
 *
 * These are the baseline policies. Can be overridden by database-stored rules.
 *
 * IMPORTANT: deny ALWAYS overrides allow
 */
export const DEFAULT_FIELD_ACCESS_POLICIES: Record<string, FieldAccessRule> = {
  /**
   * PUBLIC ROLE
   * No authentication required
   */
  public: {
    allowSelfOnly: false,
    allow: [],
    deny: ['*'], // Deny everything by default
    entityRules: {},
  },

  /**
   * USER ROLE
   * Basic authenticated user
   * Can only access their own data
   * Cannot see sensitive/internal fields
   */
  user: {
    allowSelfOnly: true,
    allow: ['*'], // Allow all non-denied fields
    deny: [
      // Sensitive encrypted data
      'sensitiveEncrypted.*',
      'encryptedData.*',

      // Internal system fields
      'internalNotes',
      'adminNotes',
      'internalFlags',
      'systemMetadata',

      // Financial sensitive data
      'bankDetails',
      'taxInfo',
      'salaryInfo',

      // Medical sensitive data (for medical systems)
      'medicalNotes',
      'diagnoses',
      'prescriptions',
      'labResults',
      'visitHistory',

      // HR sensitive data (for HR systems)
      'performanceReviews',
      'disciplinaryRecords',
      'backgroundCheck',

      // E-commerce sensitive data
      'supplierCosts',
      'profitMargins',
      'vendorContracts',
    ],
    entityRules: {},
  },

  /**
   * MANAGER ROLE
   * Can manage team members
   * Can see more fields than regular users
   */
  manager: {
    allowSelfOnly: false,
    allow: ['*'],
    deny: [
      // Still hide admin-only fields
      'adminNotes',
      'systemMetadata',

      // Hide high-level financial data
      'companyFinancials',
      'boardNotes',

      // Hide executive compensation
      'executiveCompensation',
    ],
    entityRules: {},
  },

  /**
   * DOCTOR ROLE (for medical systems)
   * Can see all medical data
   * Cannot see administrative/financial data
   */
  doctor: {
    allowSelfOnly: false,
    allow: ['*'],
    deny: ['adminNotes', 'hospitalFinancials', 'employeeSalaries', 'contractDetails'],
    entityRules: {
      Worker: {
        allow: ['*'],
        deny: ['adminNotes'],
        allowRead: true,
        allowWrite: true,
        allowDelete: false,
      },
      Visit: {
        allow: ['*'],
        deny: [],
        allowRead: true,
        allowWrite: true,
        allowDelete: false,
      },
      Document: {
        allow: ['*'],
        deny: ['billingInfo'],
        allowRead: true,
        allowWrite: true,
        allowDelete: false,
      },
    },
  },

  /**
   * ADMIN ROLE
   * Full access to everything except super-admin fields
   */
  admin: {
    allowSelfOnly: false,
    allow: ['*'],
    deny: [
      // Only hide super-admin fields
      'superAdminNotes',
      'systemSecrets',
      'encryptionKeys',
    ],
    entityRules: {},
  },

  /**
   * SUPER_ADMIN ROLE
   * Absolute full access
   * Should require MFA
   */
  super_admin: {
    allowSelfOnly: false,
    allow: ['*'],
    deny: [],
    entityRules: {},
  },
};

/**
 * Get field access policy for a role
 * First checks database for custom rules, falls back to defaults
 */
export function getFieldAccessPolicy(role: string): FieldAccessRule {
  const policy = DEFAULT_FIELD_ACCESS_POLICIES[role] ?? DEFAULT_FIELD_ACCESS_POLICIES.user;
  if (!policy) {
    // Fallback to user policy if somehow missing
    return {
      allowSelfOnly: true,
      allow: ['*'],
      deny: [],
      entityRules: {},
    };
  }
  return policy;
}

/**
 * Check if a role can access a specific field
 */
export function canAccessField(role: string, fieldPath: string): boolean {
  const policy = getFieldAccessPolicy(role);

  // Check deny list first (deny overrides allow)
  if (policy.deny) {
    for (const deniedField of policy.deny) {
      if (matchesFieldPath(fieldPath, deniedField)) {
        return false;
      }
    }
  }

  // Check allow list
  if (policy.allow && policy.allow.includes('*')) {
    return true; // Allow all except denied
  }

  if (policy.allow) {
    for (const allowedField of policy.allow) {
      if (matchesFieldPath(fieldPath, allowedField)) {
        return true;
      }
    }
  }

  return false; // Default deny
}

/**
 * Check if field path matches pattern
 * Supports wildcards: "orders.*.paymentInfo"
 */
function matchesFieldPath(fieldPath: string, pattern: string): boolean {
  if (pattern === '*') return true;
  if (pattern === fieldPath) return true;

  // Convert pattern to regex
  const regexPattern = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*');

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(fieldPath);
}

/**
 * Get entity-specific rules for a role
 */
export function getEntityRules(role: string, entityName: string) {
  const policy = getFieldAccessPolicy(role);
  return policy.entityRules?.[entityName] || {};
}
