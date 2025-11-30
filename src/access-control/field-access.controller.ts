import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FieldAccessService, CreateRuleDto, UpdateRuleDto } from './field-access.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SkipFlac, AuditAccess } from './field-access.decorator';

/**
 * Field Access Controller
 *
 * REST API for managing field-level access control rules.
 * ONLY accessible to admins.
 *
 * Endpoints:
 * - GET /field-access/rules - Get all rules
 * - GET /field-access/rules/role/:role - Get rules for specific role
 * - GET /field-access/rules/entity/:entity - Get rules for specific entity
 * - POST /field-access/rules - Create new rule
 * - PUT /field-access/rules/:id - Update rule
 * - DELETE /field-access/rules/:id - Delete rule
 * - GET /field-access/logs - Get access logs
 * - GET /field-access/stats - Get access statistics
 * - POST /field-access/export - Export all rules
 * - POST /field-access/import - Import rules
 */

@ApiTags('field-access')
@ApiBearerAuth()
@Controller('field-access')
@SkipFlac() // Skip FLAC for this controller (admins need full access)
export class FieldAccessController {
  constructor(private readonly fieldAccessService: FieldAccessService) {}

  /**
   * Get all field access rules
   */
  @ApiOperation({ summary: 'Get all field access rules' })
  @ApiResponse({ status: 200, description: 'Rules retrieved successfully' })
  @Get('rules')
  async getAllRules() {
    return this.fieldAccessService.getAllRules();
  }

  /**
   * Get rules for a specific role
   */
  @ApiOperation({ summary: 'Get rules for a specific role' })
  @ApiResponse({ status: 200, description: 'Rules retrieved successfully' })
  @Get('rules/role/:role')
  async getRulesByRole(@Param('role') role: string) {
    return this.fieldAccessService.getRulesByRole(role);
  }

  /**
   * Get rules for a specific entity
   */
  @ApiOperation({ summary: 'Get rules for a specific entity' })
  @ApiResponse({ status: 200, description: 'Rules retrieved successfully' })
  @Get('rules/entity/:entity')
  async getRulesByEntity(@Param('entity') entity: string) {
    return this.fieldAccessService.getRulesByEntity(entity);
  }

  /**
   * Get effective policy for a role (merged default + database)
   */
  @ApiOperation({ summary: 'Get effective policy for a role' })
  @ApiResponse({ status: 200, description: 'Policy retrieved successfully' })
  @Get('policy/:role')
  async getEffectivePolicy(@Param('role') role: string, @Query('entity') entity?: string) {
    return this.fieldAccessService.getEffectivePolicy(role, entity);
  }

  /**
   * Create a new field access rule
   */
  @ApiOperation({ summary: 'Create a new field access rule' })
  @ApiResponse({ status: 201, description: 'Rule created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @Post('rules')
  @AuditAccess('FieldAccessRule')
  async createRule(@Body() dto: CreateRuleDto) {
    return this.fieldAccessService.createRule(dto);
  }

  /**
   * Update an existing rule
   */
  @ApiOperation({ summary: 'Update a field access rule' })
  @ApiResponse({ status: 200, description: 'Rule updated successfully' })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  @Put('rules/:id')
  @AuditAccess('FieldAccessRule')
  async updateRule(@Param('id') id: string, @Body() dto: UpdateRuleDto) {
    return this.fieldAccessService.updateRule(id, dto);
  }

  /**
   * Delete a rule
   */
  @ApiOperation({ summary: 'Delete a field access rule' })
  @ApiResponse({ status: 204, description: 'Rule deleted successfully' })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  @Delete('rules/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @AuditAccess('FieldAccessRule')
  async deleteRule(@Param('id') id: string) {
    await this.fieldAccessService.deleteRule(id);
  }

  /**
   * Deactivate a rule (soft delete)
   */
  @ApiOperation({ summary: 'Deactivate a field access rule' })
  @ApiResponse({ status: 200, description: 'Rule deactivated successfully' })
  @Put('rules/:id/deactivate')
  @AuditAccess('FieldAccessRule')
  async deactivateRule(@Param('id') id: string) {
    return this.fieldAccessService.deactivateRule(id);
  }

  /**
   * Activate a rule
   */
  @ApiOperation({ summary: 'Activate a field access rule' })
  @ApiResponse({ status: 200, description: 'Rule activated successfully' })
  @Put('rules/:id/activate')
  @AuditAccess('FieldAccessRule')
  async activateRule(@Param('id') id: string) {
    return this.fieldAccessService.activateRule(id);
  }

  /**
   * Get access logs
   */
  @ApiOperation({ summary: 'Get access logs' })
  @ApiResponse({ status: 200, description: 'Logs retrieved successfully' })
  @Get('logs')
  async getAccessLogs(
    @Query('userId') userId?: string,
    @Query('limit') limit = 100,
    @Query('offset') offset = 0,
  ) {
    if (userId) {
      return this.fieldAccessService.getAccessLogs(userId, limit, offset);
    }
    return this.fieldAccessService.getDeniedAccessLogs(limit, offset);
  }

  /**
   * Get denied access logs (security monitoring)
   */
  @ApiOperation({ summary: 'Get denied access logs' })
  @ApiResponse({ status: 200, description: 'Logs retrieved successfully' })
  @Get('logs/denied')
  async getDeniedAccessLogs(@Query('limit') limit = 100, @Query('offset') offset = 0) {
    return this.fieldAccessService.getDeniedAccessLogs(limit, offset);
  }

  /**
   * Get access statistics
   */
  @ApiOperation({ summary: 'Get access statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @Get('stats')
  async getAccessStats(@Query('userId') userId?: string) {
    return this.fieldAccessService.getAccessStats(userId);
  }

  /**
   * Export all rules (for backup)
   */
  @ApiOperation({ summary: 'Export all field access rules' })
  @ApiResponse({ status: 200, description: 'Rules exported successfully' })
  @Get('export')
  async exportRules() {
    return this.fieldAccessService.exportRules();
  }

  /**
   * Import rules (for restore)
   */
  @ApiOperation({ summary: 'Import field access rules' })
  @ApiResponse({ status: 201, description: 'Rules imported successfully' })
  @Post('import')
  @AuditAccess('FieldAccessRule')
  async importRules(@Body() rules: CreateRuleDto[]) {
    await this.fieldAccessService.importRules(rules);
    return { message: 'Rules imported successfully' };
  }
}
