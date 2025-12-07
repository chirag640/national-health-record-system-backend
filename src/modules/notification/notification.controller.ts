import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { CreateNotificationDto, CreateBulkNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationFilterDto } from './dto/notification-filter.dto';
import { NotificationPreferenceDto } from './dto/notification-preference.dto';
import {
  NotificationOutputDto,
  NotificationListOutputDto,
  NotificationStatsOutputDto,
} from './dto/notification-output.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UserRole } from '../../auth/schemas/user.schema';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'notifications', version: '1' })
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @Roles(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new notification' })
  @ApiResponse({
    status: 201,
    description: 'Notification created successfully',
    type: NotificationOutputDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createDto: CreateNotificationDto): Promise<any> {
    return this.notificationService.create(createDto);
  }

  @Post('bulk')
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create bulk notifications for multiple users' })
  @ApiResponse({ status: 201, description: 'Bulk notifications created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createBulk(@Body() createBulkDto: CreateBulkNotificationDto): Promise<any> {
    return this.notificationService.createBulk(createBulkDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all notifications with filters' })
  @ApiResponse({
    status: 200,
    description: 'List of notifications',
    type: NotificationListOutputDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Query() filters: NotificationFilterDto, @CurrentUser() user: any): Promise<any> {
    // Non-admin users can only see their own notifications
    if (user.role === UserRole.PATIENT || user.role === UserRole.DOCTOR) {
      filters.recipientId = user.userId;
    }

    return this.notificationService.findAll(filters);
  }

  @Get('me/unread')
  @ApiOperation({ summary: 'Get my unread notifications' })
  @ApiResponse({
    status: 200,
    description: 'List of unread notifications',
    type: [NotificationOutputDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyUnread(@CurrentUser() user: any, @Query('limit') limit?: number): Promise<any> {
    return this.notificationService.getUnreadForUser(user.userId, limit);
  }

  @Get('me/stats')
  @ApiOperation({ summary: 'Get my notification statistics' })
  @ApiResponse({
    status: 200,
    description: 'Notification statistics',
    type: NotificationStatsOutputDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyStats(@CurrentUser() user: any): Promise<any> {
    return this.notificationService.getUserStatistics(user.userId);
  }

  @Post('me/mark-all-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all my notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markAllMyAsRead(@CurrentUser() user: any): Promise<any> {
    return this.notificationService.markAllAsReadForUser(user.userId);
  }

  @Post('mark-many-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark multiple notifications as read' })
  @ApiResponse({ status: 200, description: 'Notifications marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markManyAsRead(@Body('ids') ids: string[]): Promise<any> {
    return this.notificationService.markManyAsRead(ids);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a notification by ID' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification details', type: NotificationOutputDto })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(@Param('id') id: string): Promise<any> {
    return this.notificationService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a notification' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({
    status: 200,
    description: 'Notification updated successfully',
    type: NotificationOutputDto,
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateNotificationDto): Promise<any> {
    return this.notificationService.update(id, updateDto);
  }

  @Post(':id/mark-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read',
    type: NotificationOutputDto,
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markAsRead(@Param('id') id: string): Promise<any> {
    return this.notificationService.markAsRead(id);
  }

  @Post(':id/acknowledge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Acknowledge a notification' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({
    status: 200,
    description: 'Notification acknowledged',
    type: NotificationOutputDto,
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async acknowledge(@Param('id') id: string): Promise<any> {
    return this.notificationService.markAsAcknowledged(id);
  }

  @Delete(':id')
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 204, description: 'Notification deleted successfully' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.notificationService.remove(id);
  }

  @Delete('bulk/delete')
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete multiple notifications' })
  @ApiResponse({ status: 200, description: 'Notifications deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async removeMany(@Body('ids') ids: string[]): Promise<any> {
    return this.notificationService.removeMany(ids);
  }

  // ========== Preference Endpoints ==========

  @Get('preferences/me')
  @ApiOperation({ summary: 'Get my notification preferences' })
  @ApiResponse({ status: 200, description: 'User notification preferences' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyPreferences(@CurrentUser() user: any): Promise<any> {
    return this.notificationService.getUserPreferences(user.userId);
  }

  @Patch('preferences/me')
  @ApiOperation({ summary: 'Update my notification preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateMyPreferences(
    @CurrentUser() user: any,
    @Body() preferencesDto: NotificationPreferenceDto,
  ): Promise<any> {
    return this.notificationService.updateUserPreferences(user.userId, preferencesDto);
  }

  @Post('preferences/me/device-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add a device token for push notifications' })
  @ApiResponse({ status: 200, description: 'Device token added successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addMyDeviceToken(@CurrentUser() user: any, @Body('token') token: string): Promise<any> {
    return this.notificationService.addDeviceToken(user.userId, token);
  }

  @Delete('preferences/me/device-token/:token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a device token' })
  @ApiParam({ name: 'token', description: 'Device token to remove' })
  @ApiResponse({ status: 200, description: 'Device token removed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async removeMyDeviceToken(@CurrentUser() user: any, @Param('token') token: string): Promise<any> {
    return this.notificationService.removeDeviceToken(user.userId, token);
  }

  // ========== Admin Endpoints ==========

  @Post('admin/process-scheduled')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process scheduled notifications (Admin only)' })
  @ApiResponse({ status: 200, description: 'Scheduled notifications processed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async processScheduled(): Promise<any> {
    const count = await this.notificationService.processScheduledNotifications();
    return { message: `Processed ${count} scheduled notifications` };
  }

  @Post('admin/process-expired')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark expired notifications (Admin only)' })
  @ApiResponse({ status: 200, description: 'Expired notifications marked' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async processExpired(): Promise<any> {
    const count = await this.notificationService.processExpiredNotifications();
    return { message: `Marked ${count} notifications as expired` };
  }

  @Post('admin/cleanup')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cleanup old read notifications (Admin only)' })
  @ApiQuery({
    name: 'daysOld',
    required: false,
    description: 'Delete notifications older than X days (default: 90)',
  })
  @ApiResponse({ status: 200, description: 'Old notifications cleaned up' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async cleanup(@Query('daysOld') daysOld?: number): Promise<any> {
    const count = await this.notificationService.cleanupOldNotifications(daysOld);
    return { message: `Deleted ${count} old notifications` };
  }
}
