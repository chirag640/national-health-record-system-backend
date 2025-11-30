export enum ErrorCode {
  // Authentication Errors (1xxx)
  INVALID_CREDENTIALS = 'AUTH_1001',
  TOKEN_EXPIRED = 'AUTH_1002',
  TOKEN_INVALID = 'AUTH_1003',
  TOKEN_MISSING = 'AUTH_1004',
  REFRESH_TOKEN_EXPIRED = 'AUTH_1005',
  REFRESH_TOKEN_INVALID = 'AUTH_1006',
  REFRESH_TOKEN_REUSE_DETECTED = 'AUTH_1007',
  UNAUTHORIZED = 'AUTH_1008',

  // User Errors (2xxx)
  USER_NOT_FOUND = 'USER_2001',
  USER_EMAIL_DUPLICATE = 'USER_2002',
  USER_ALREADY_EXISTS = 'USER_2003',
  USER_INACTIVE = 'USER_2004',
  USER_SUSPENDED = 'USER_2005',

  // Authorization Errors (3xxx)
  FORBIDDEN = 'AUTHZ_3001',
  INSUFFICIENT_PERMISSIONS = 'AUTHZ_3002',
  ROLE_NOT_FOUND = 'AUTHZ_3003',
  INVALID_ROLE = 'AUTHZ_3004',

  // Validation Errors (4xxx)
  VALIDATION_FAILED = 'VAL_4001',
  INVALID_INPUT = 'VAL_4002',
  INVALID_ID = 'VAL_4003',
  REQUIRED_FIELD_MISSING = 'VAL_4004',
  INVALID_FORMAT = 'VAL_4005',

  // Resource Errors (5xxx)
  RESOURCE_NOT_FOUND = 'RES_5001',
  RESOURCE_ALREADY_EXISTS = 'RES_5002',
  RESOURCE_CONFLICT = 'RES_5003',
  RESOURCE_LOCKED = 'RES_5004',
  RESOURCE_DELETED = 'RES_5005',

  // Database Errors (6xxx)
  DATABASE_ERROR = 'DB_6001',
  DATABASE_CONNECTION_FAILED = 'DB_6002',
  TRANSACTION_FAILED = 'DB_6003',
  QUERY_FAILED = 'DB_6004',
  DUPLICATE_KEY = 'DB_6005',

  // Server Errors (7xxx)
  INTERNAL_SERVER_ERROR = 'SRV_7001',
  SERVICE_UNAVAILABLE = 'SRV_7002',
  REQUEST_TIMEOUT = 'SRV_7003',
  EXTERNAL_SERVICE_ERROR = 'SRV_7004',

  // Rate Limiting (8xxx)
  RATE_LIMIT_EXCEEDED = 'RATE_8001',
  TOO_MANY_REQUESTS = 'RATE_8002',

  // CSRF Errors (9xxx)
  CSRF_TOKEN_MISSING = 'CSRF_9001',
  CSRF_TOKEN_INVALID = 'CSRF_9002',
}

export const ErrorMessages: Record<ErrorCode, string> = {
  // Authentication
  [ErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password',
  [ErrorCode.TOKEN_EXPIRED]: 'Access token has expired',
  [ErrorCode.TOKEN_INVALID]: 'Invalid or malformed token',
  [ErrorCode.TOKEN_MISSING]: 'Authorization token is required',
  [ErrorCode.REFRESH_TOKEN_EXPIRED]: 'Refresh token has expired, please login again',
  [ErrorCode.REFRESH_TOKEN_INVALID]: 'Invalid refresh token',
  [ErrorCode.REFRESH_TOKEN_REUSE_DETECTED]: 'Token reuse detected, security breach possible',
  [ErrorCode.UNAUTHORIZED]: 'Unauthorized access',

  // User
  [ErrorCode.USER_NOT_FOUND]: 'User not found',
  [ErrorCode.USER_EMAIL_DUPLICATE]: 'Email address is already registered',
  [ErrorCode.USER_ALREADY_EXISTS]: 'User already exists',
  [ErrorCode.USER_INACTIVE]: 'User account is inactive',
  [ErrorCode.USER_SUSPENDED]: 'User account has been suspended',

  // Authorization
  [ErrorCode.FORBIDDEN]: 'Access forbidden',
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 'You do not have permission to perform this action',
  [ErrorCode.ROLE_NOT_FOUND]: 'Role not found',
  [ErrorCode.INVALID_ROLE]: 'Invalid role specified',

  // Validation
  [ErrorCode.VALIDATION_FAILED]: 'Validation failed',
  [ErrorCode.INVALID_INPUT]: 'Invalid input provided',
  [ErrorCode.INVALID_ID]: 'Invalid ID format',
  [ErrorCode.REQUIRED_FIELD_MISSING]: 'Required field is missing',
  [ErrorCode.INVALID_FORMAT]: 'Invalid format',

  // Resources
  [ErrorCode.RESOURCE_NOT_FOUND]: 'Resource not found',
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: 'Resource already exists',
  [ErrorCode.RESOURCE_CONFLICT]: 'Resource conflict detected',
  [ErrorCode.RESOURCE_LOCKED]: 'Resource is locked',
  [ErrorCode.RESOURCE_DELETED]: 'Resource has been deleted',

  // Database
  [ErrorCode.DATABASE_ERROR]: 'Database error occurred',
  [ErrorCode.DATABASE_CONNECTION_FAILED]: 'Failed to connect to database',
  [ErrorCode.TRANSACTION_FAILED]: 'Transaction failed',
  [ErrorCode.QUERY_FAILED]: 'Database query failed',
  [ErrorCode.DUPLICATE_KEY]: 'Duplicate key error',

  // Server
  [ErrorCode.INTERNAL_SERVER_ERROR]: 'Internal server error',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable',
  [ErrorCode.REQUEST_TIMEOUT]: 'Request timeout',
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'External service error',

  // Rate Limiting
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded, please try again later',
  [ErrorCode.TOO_MANY_REQUESTS]: 'Too many requests',

  // CSRF
  [ErrorCode.CSRF_TOKEN_MISSING]: 'CSRF token is missing',
  [ErrorCode.CSRF_TOKEN_INVALID]: 'Invalid CSRF token',
};
