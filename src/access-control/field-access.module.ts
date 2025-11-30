import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FieldAccessService } from './field-access.service';
import { FieldAccessController } from './field-access.controller';
import { FieldAccessInterceptor } from './field-access.interceptor';
import {
  FieldAccessRule,
  FieldAccessRuleSchema,
  FieldAccessLog,
  FieldAccessLogSchema,
} from './field-access-rule.schema';

/**
 * Field Access Module
 *
 * Provides field-level access control (FLAC) system.
 *
 * Features:
 * - Role-based field filtering
 * - Dynamic permission rules stored in database
 * - Admin UI for managing permissions
 * - Automatic response filtering via interceptor
 * - Audit logging for compliance
 * - Works with ANY database (medical, e-commerce, HR, etc.)
 *
 * Usage:
 * 1. Import this module globally (done by default)
 * 2. Apply FieldAccessInterceptor globally in main.ts
 * 3. Use @FieldAccess() decorator on controllers
 * 4. Admins manage rules via /field-access/rules API
 *
 * Example:
 * ```ts
 * @FieldAccess({ entityName: 'Worker', requireSelfOnly: true })
 * @Get(':id')
 * async getWorker(@Param('id') id: string) {
 *   return this.workerService.findById(id);
 * }
 * ```
 */

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FieldAccessRule.name, schema: FieldAccessRuleSchema },
      { name: FieldAccessLog.name, schema: FieldAccessLogSchema },
    ]),
  ],
  controllers: [FieldAccessController],
  providers: [FieldAccessService, FieldAccessInterceptor],
  exports: [FieldAccessService, FieldAccessInterceptor],
})
export class FieldAccessModule {}
