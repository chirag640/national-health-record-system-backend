import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuditLogService } from './audit-log.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { UpdateAuditLogDto } from './dto/update-audit-log.dto';
import { AuditLogOutputDto } from './dto/audit-log-output.dto';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/schemas/user.schema';

@ApiTags('Audit Logs')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'audit-logs', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.SUPER_ADMIN) // Only system/admin can manually create audit logs
  @ApiOperation({
    summary: 'Create audit log entry (System/Admin only)',
    description: 'Manually create audit log. Most logs are auto-created by AuditLogInterceptor.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Audit log created successfully',
    type: AuditLogOutputDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid audit data' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden - SuperAdmin only' })
  create(@Body() dto: CreateAuditLogDto): Promise<AuditLogOutputDto> {
    return this.auditLogService.create(dto);
  }

  @Get()
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'List audit logs',
    description: 'Retrieve paginated audit trail for compliance and security monitoring',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (default: 20, max: 100)',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Audit logs retrieved successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden - Admin only' })
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.auditLogService.findAll(page, limit);
  }

  @Get(':id')
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get audit log details',
    description: 'Retrieve specific audit log entry with full request/response data',
  })
  @ApiParam({ name: 'id', description: 'Audit Log MongoDB ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Audit log retrieved successfully',
    type: AuditLogOutputDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Audit log not found' })
  findOne(@Param('id') id: string): Promise<AuditLogOutputDto> {
    return this.auditLogService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN) // ⚠️ WARNING: Audit logs should be immutable in production!
  @ApiOperation({
    summary: '⚠️ Update audit log (NOT RECOMMENDED)',
    description:
      'SECURITY WARNING: Modifying audit logs defeats tamper detection. Should be disabled in production.',
  })
  @ApiParam({ name: 'id', description: 'Audit Log MongoDB ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Audit log updated',
    type: AuditLogOutputDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - This endpoint should be disabled',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Audit log not found' })
  update(@Param('id') id: string, @Body() dto: UpdateAuditLogDto): Promise<AuditLogOutputDto> {
    return this.auditLogService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.SUPER_ADMIN) // ⚠️ WARNING: Audit logs should be immutable!
  @ApiOperation({
    summary: '⚠️ Delete audit log (NOT RECOMMENDED)',
    description:
      'SECURITY WARNING: Deleting audit logs defeats compliance. Should be disabled in production.',
  })
  @ApiParam({ name: 'id', description: 'Audit Log MongoDB ID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Audit log deleted' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - This endpoint should be disabled',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Audit log not found' })
  remove(@Param('id') id: string): Promise<void> {
    return this.auditLogService.remove(id);
  }
}
