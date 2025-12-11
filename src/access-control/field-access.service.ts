import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FieldAccessRule, FieldAccessLog, AccessAction } from './field-access-rule.schema';
import { getFieldAccessPolicy, FieldAccessRule as PolicyRule } from './field-access.policy';

/**
 * Field Access Service
 *
 * Manages dynamic field access rules stored in database.
 * Provides CRUD operations for admins to manage permissions via UI.
 */

export interface CreateRuleDto {
  role: string;
  entityName?: string;
  allowSelfOnly?: boolean;
  allow?: string[];
  deny?: string[];
  allowRead?: boolean;
  allowWrite?: boolean;
  allowDelete?: boolean;
  priority?: number;
  description?: string;
  createdBy?: string;
  expiresAt?: Date;
}

export interface UpdateRuleDto extends Partial<CreateRuleDto> {
  modifiedBy?: string;
}

export interface LogAccessDto {
  userId: string;
  role: string;
  entityName: string;
  resourceId?: string;
  action: AccessAction;
  deniedFields?: string[];
  granted: boolean;
  denialReason?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class FieldAccessService {
  private readonly logger = new Logger(FieldAccessService.name);

  constructor(
    @InjectModel(FieldAccessRule.name)
    private readonly ruleModel: Model<FieldAccessRule>,
    @InjectModel(FieldAccessLog.name)
    private readonly logModel: Model<FieldAccessLog>,
  ) {}

  /**
   * Get effective policy for a role (database rules + defaults)
   */
  async getEffectivePolicy(role: string, entityName?: string): Promise<PolicyRule> {
    // Start with default policy
    const defaultPolicy = getFieldAccessPolicy(role);

    // Get database rules
    const dbRules = await this.ruleModel
      .find({
        role,
        isActive: true,
        $and: [
          {
            $or: [{ entityName: entityName || null }, { entityName: { $exists: false } }],
          },
          {
            $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: { $exists: false } }],
          },
        ],
      })
      .sort({ priority: -1 })
      .exec();

    // Merge rules (database overrides defaults)
    const mergedPolicy = { ...defaultPolicy };

    for (const rule of dbRules) {
      if (rule.allow && rule.allow.length > 0) {
        mergedPolicy.allow = [...(mergedPolicy.allow || []), ...rule.allow];
      }
      if (rule.deny && rule.deny.length > 0) {
        mergedPolicy.deny = [...(mergedPolicy.deny || []), ...rule.deny];
      }
      if (rule.allowSelfOnly !== undefined) {
        mergedPolicy.allowSelfOnly = rule.allowSelfOnly;
      }
    }

    // Remove duplicates
    if (mergedPolicy.allow) {
      mergedPolicy.allow = [...new Set(mergedPolicy.allow)];
    }
    if (mergedPolicy.deny) {
      mergedPolicy.deny = [...new Set(mergedPolicy.deny)];
    }

    return mergedPolicy;
  }

  /**
   * Create a new field access rule
   */
  async createRule(dto: CreateRuleDto): Promise<FieldAccessRule> {
    const rule = new this.ruleModel(dto);
    await rule.save();

    this.logger.log(
      `Created field access rule for role: ${dto.role}, entity: ${dto.entityName || 'global'}`,
    );

    return rule;
  }

  /**
   * Update an existing rule
   */
  async updateRule(ruleId: string, dto: UpdateRuleDto): Promise<FieldAccessRule> {
    const rule = await this.ruleModel.findByIdAndUpdate(
      ruleId,
      { ...dto, modifiedBy: dto.modifiedBy },
      { new: true },
    );

    if (!rule) {
      throw new Error(`Rule ${ruleId} not found`);
    }

    this.logger.log(`Updated field access rule: ${ruleId}`);

    return rule;
  }

  /**
   * Delete a rule
   */
  async deleteRule(ruleId: string): Promise<void> {
    await this.ruleModel.findByIdAndDelete(ruleId);
    this.logger.log(`Deleted field access rule: ${ruleId}`);
  }

  /**
   * Get all rules for a role
   */
  async getRulesByRole(role: string): Promise<FieldAccessRule[]> {
    return this.ruleModel.find({ role, isActive: true }).sort({ priority: -1 }).exec();
  }

  /**
   * Get all rules for an entity
   */
  async getRulesByEntity(entityName: string): Promise<FieldAccessRule[]> {
    return this.ruleModel
      .find({ entityName, isActive: true })
      .sort({ role: 1, priority: -1 })
      .exec();
  }

  /**
   * Get all active rules
   */
  async getAllRules(): Promise<FieldAccessRule[]> {
    return this.ruleModel.find({ isActive: true }).sort({ role: 1, priority: -1 }).exec();
  }

  /**
   * Deactivate a rule (soft delete)
   */
  async deactivateRule(ruleId: string): Promise<FieldAccessRule> {
    const rule = await this.ruleModel.findByIdAndUpdate(ruleId, { isActive: false }, { new: true });

    if (!rule) {
      throw new Error(`Rule ${ruleId} not found`);
    }

    this.logger.log(`Deactivated field access rule: ${ruleId}`);

    return rule;
  }

  /**
   * Activate a rule
   */
  async activateRule(ruleId: string): Promise<FieldAccessRule> {
    const rule = await this.ruleModel.findByIdAndUpdate(ruleId, { isActive: true }, { new: true });

    if (!rule) {
      throw new Error(`Rule ${ruleId} not found`);
    }

    this.logger.log(`Activated field access rule: ${ruleId}`);

    return rule;
  }

  /**
   * Log access attempt (for audit trail)
   */
  async logAccess(dto: LogAccessDto): Promise<void> {
    try {
      const log = new this.logModel(dto);
      await log.save();
    } catch (error: any) {
      const err = error as Error;
      this.logger.error(`Failed to log access: ${err.message}`);
    }
  }

  /**
   * Get access logs for a user
   */
  async getAccessLogs(userId: string, limit = 100, offset = 0): Promise<FieldAccessLog[]> {
    return this.logModel.find({ userId }).sort({ createdAt: -1 }).skip(offset).limit(limit).exec();
  }

  /**
   * Get denied access logs (security monitoring)
   */
  async getDeniedAccessLogs(limit = 100, offset = 0): Promise<FieldAccessLog[]> {
    return this.logModel
      .find({ granted: false })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .exec();
  }

  /**
   * Get access statistics
   */
  async getAccessStats(userId?: string): Promise<any> {
    const filter = userId ? { userId } : {};

    const [total, granted, denied, byAction, byRole] = await Promise.all([
      this.logModel.countDocuments(filter),
      this.logModel.countDocuments({ ...filter, granted: true }),
      this.logModel.countDocuments({ ...filter, granted: false }),
      this.logModel.aggregate([
        { $match: filter },
        { $group: { _id: '$action', count: { $sum: 1 } } },
      ]),
      this.logModel.aggregate([
        { $match: filter },
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
    ]);

    return {
      total,
      granted,
      denied,
      denialRate: total > 0 ? ((denied / total) * 100).toFixed(2) + '%' : '0%',
      byAction,
      byRole,
    };
  }

  /**
   * Bulk create rules (for seeding/migration)
   */
  async bulkCreateRules(rules: CreateRuleDto[]): Promise<FieldAccessRule[]> {
    const created = await this.ruleModel.insertMany(rules);
    this.logger.log(`Bulk created ${created.length} field access rules`);
    return created as any as FieldAccessRule[];
  }

  /**
   * Export all rules (for backup)
   */
  async exportRules(): Promise<any[]> {
    const rules = await this.ruleModel.find().lean().exec();
    return rules.map((rule) => ({
      role: rule.role,
      entityName: rule.entityName,
      allowSelfOnly: rule.allowSelfOnly,
      allow: rule.allow,
      deny: rule.deny,
      allowRead: rule.allowRead,
      allowWrite: rule.allowWrite,
      allowDelete: rule.allowDelete,
      priority: rule.priority,
      description: rule.description,
    }));
  }

  /**
   * Import rules (for restore)
   */
  async importRules(rules: CreateRuleDto[]): Promise<void> {
    await this.ruleModel.deleteMany({}); // Clear existing
    await this.bulkCreateRules(rules);
    this.logger.log(`Imported ${rules.length} field access rules`);
  }
}
