import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  IsDate,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  NotificationType,
  NotificationStatus,
  NotificationPriority,
  NotificationChannel,
} from '../schemas/notification.schema';

/**
 * DTO for filtering and querying notifications
 */
export class NotificationFilterDto {
  @ApiPropertyOptional({
    example: '507f1f77bcf86cd799439011',
    description: 'Filter by recipient user ID',
  })
  @IsOptional()
  @IsMongoId()
  recipientId?: string;

  @ApiPropertyOptional({
    enum: NotificationType,
    description: 'Filter by notification type',
  })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({
    enum: NotificationStatus,
    description: 'Filter by status',
  })
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;

  @ApiPropertyOptional({
    enum: NotificationPriority,
    description: 'Filter by priority',
  })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @ApiPropertyOptional({
    enum: NotificationChannel,
    description: 'Filter by delivery channel',
  })
  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @ApiPropertyOptional({
    example: 'prescriptions',
    description: 'Filter by category',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    type: Boolean,
    example: false,
    description: 'Filter by read status (true = read, false = unread)',
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isRead?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    example: false,
    description: 'Filter by expired status',
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isExpired?: boolean;

  @ApiPropertyOptional({
    type: Date,
    example: '2024-12-01T00:00:00Z',
    description: 'Filter notifications created after this date',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  createdAfter?: Date;

  @ApiPropertyOptional({
    type: Date,
    example: '2024-12-31T23:59:59Z',
    description: 'Filter notifications created before this date',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  createdBefore?: Date;

  @ApiPropertyOptional({
    example: '507f1f77bcf86cd799439012',
    description: 'Filter by related entity ID',
  })
  @IsOptional()
  @IsMongoId()
  relatedEntityId?: string;

  @ApiPropertyOptional({
    example: 'Prescription',
    description: 'Filter by related entity model',
  })
  @IsOptional()
  @IsString()
  relatedEntityModel?: string;

  @ApiPropertyOptional({
    example: '507f1f77bcf86cd799439013',
    description: 'Filter by sender ID',
  })
  @IsOptional()
  @IsMongoId()
  senderId?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Page number',
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 20,
    description: 'Number of items per page',
    default: 20,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({
    example: 'createdAt',
    description: 'Field to sort by',
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    example: 'desc',
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
