import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Field Access Rule Schema
 *
 * Stores dynamic field-level access control rules in the database.
 * Allows admins to modify permissions without code deployment.
 *
 * This schema works for ANY system (medical, e-commerce, HR, finance, etc.)
 */

export enum RoleType {
  PUBLIC = 'public',
  USER = 'user',
  MANAGER = 'manager',
  DOCTOR = 'doctor',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
  CUSTOM = 'custom',
}

export enum AccessAction {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
}

@Schema({ timestamps: true })
export class FieldAccessRule extends Document {
  /**
   * Role name (e.g., 'user', 'admin', 'doctor', 'nurse')
   * Can be custom roles created by admins
   */
  @Prop({ required: true, index: true })
  role!: string;

  /**
   * Entity name (e.g., 'Worker', 'Order', 'Patient', 'Product')
   * If null, applies globally to all entities
   */
  @Prop({ index: true })
  entityName?: string;

  /**
   * User can only access their own records
   */
  @Prop({ default: false })
  allowSelfOnly!: boolean;

  /**
   * List of allowed field paths
   * Examples: ['email', 'profile.name', 'orders.*.items']
   * Use '*' for all fields
   */
  @Prop({ type: [String], default: [] })
  allow!: string[];

  /**
   * List of denied field paths (overrides allow)
   * Examples: ['ssn', 'profile.bankDetails', 'medicalNotes']
   */
  @Prop({ type: [String], default: [] })
  deny!: string[];

  /**
   * Action-level permissions
   */
  @Prop({ default: true })
  allowRead!: boolean;

  @Prop({ default: false })
  allowWrite!: boolean;

  @Prop({ default: false })
  allowDelete!: boolean;

  /**
   * Priority for rule resolution (higher = more important)
   * Useful when multiple rules apply to same role/entity
   */
  @Prop({ default: 0 })
  priority!: number;

  /**
   * Rule is active/inactive
   */
  @Prop({ default: true })
  isActive!: boolean;

  /**
   * Description for admins
   */
  @Prop()
  description?: string;

  /**
   * Created by admin user ID
   */
  @Prop()
  createdBy?: string;

  /**
   * Last modified by admin user ID
   */
  @Prop()
  modifiedBy?: string;

  /**
   * Expiration date (optional)
   * Useful for temporary access grants
   */
  @Prop()
  expiresAt?: Date;
}

export const FieldAccessRuleSchema = SchemaFactory.createForClass(FieldAccessRule);

// Indexes for fast lookups
FieldAccessRuleSchema.index({ role: 1, entityName: 1, priority: -1 });
FieldAccessRuleSchema.index({ isActive: 1, expiresAt: 1 });

/**
 * Audit Log Schema
 *
 * Tracks all access control decisions for compliance and debugging
 */

@Schema({ timestamps: true })
export class FieldAccessLog extends Document {
  /**
   * User ID who attempted access
   */
  @Prop({ required: true, index: true })
  userId!: string;

  /**
   * User's role
   */
  @Prop({ required: true })
  role!: string;

  /**
   * Entity name accessed
   */
  @Prop({ required: true })
  entityName!: string;

  /**
   * Resource ID accessed
   */
  @Prop()
  resourceId?: string;

  /**
   * Action attempted
   */
  @Prop({ required: true, enum: AccessAction })
  action!: AccessAction;

  /**
   * Fields that were denied
   */
  @Prop({ type: [String], default: [] })
  deniedFields!: string[];

  /**
   * Access granted or denied
   */
  @Prop({ required: true })
  granted!: boolean;

  /**
   * Reason for denial (if denied)
   */
  @Prop()
  denialReason?: string;

  /**
   * IP address of request
   */
  @Prop()
  ipAddress?: string;

  /**
   * User agent
   */
  @Prop()
  userAgent?: string;

  /**
   * Additional metadata
   */
  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const FieldAccessLogSchema = SchemaFactory.createForClass(FieldAccessLog);

// TTL index - automatically delete logs older than 90 days
FieldAccessLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });
FieldAccessLogSchema.index({ userId: 1, createdAt: -1 });
FieldAccessLogSchema.index({ granted: 1, action: 1 });
