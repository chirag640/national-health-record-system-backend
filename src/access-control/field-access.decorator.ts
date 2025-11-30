import { SetMetadata } from '@nestjs/common';

/**
 * Field Access Decorator
 *
 * Apply to controller methods to enforce field-level access control
 *
 * Usage:
 *
 * @FieldAccess({ entityName: 'Worker', requireSelfOnly: true })
 * @Get(':id')
 * async getWorker(@Param('id') id: string) {
 *   return this.workerService.findById(id);
 * }
 */

export interface FieldAccessConfig {
  /**
   * Entity name for this endpoint
   */
  entityName?: string;

  /**
   * Require self-only access enforcement
   */
  requireSelfOnly?: boolean;

  /**
   * Skip FLAC for this endpoint (use carefully!)
   */
  skipFlac?: boolean;

  /**
   * Custom field override (bypass policy)
   */
  customAllow?: string[];

  /**
   * Custom field denial (add to policy)
   */
  customDeny?: string[];

  /**
   * Enable audit logging for this endpoint
   */
  enableAudit?: boolean;
}

export const FIELD_ACCESS_KEY = 'fieldAccess';

/**
 * Decorator to configure field-level access control
 */
export const FieldAccess = (config: FieldAccessConfig = {}) =>
  SetMetadata(FIELD_ACCESS_KEY, {
    entityName: config.entityName,
    requireSelfOnly: config.requireSelfOnly ?? false,
    skipFlac: config.skipFlac ?? false,
    customAllow: config.customAllow ?? [],
    customDeny: config.customDeny ?? [],
    enableAudit: config.enableAudit ?? true,
  });

/**
 * Decorator to skip FLAC (use for public endpoints)
 */
export const SkipFlac = () => SetMetadata(FIELD_ACCESS_KEY, { skipFlac: true });

/**
 * Decorator to enforce self-only access
 */
export const SelfOnly = (entityName?: string) =>
  SetMetadata(FIELD_ACCESS_KEY, {
    entityName,
    requireSelfOnly: true,
    enableAudit: true,
  });

/**
 * Decorator to enable audit logging
 */
export const AuditAccess = (entityName?: string) =>
  SetMetadata(FIELD_ACCESS_KEY, {
    entityName,
    enableAudit: true,
  });
