import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsBoolean,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType, NotificationChannel } from '../schemas/notification.schema';

/**
 * DTO for channel preference
 */
export class ChannelPreferenceDto {
  @ApiProperty({
    enum: NotificationChannel,
    example: NotificationChannel.EMAIL,
    description: 'Notification channel',
  })
  @IsEnum(NotificationChannel)
  channel!: NotificationChannel;

  @ApiProperty({
    example: true,
    description: 'Enable/disable this channel',
  })
  @IsBoolean()
  enabled!: boolean;
}

/**
 * DTO for type preference
 */
export class TypePreferenceDto {
  @ApiProperty({
    enum: NotificationType,
    example: NotificationType.PRESCRIPTION_EXPIRING,
    description: 'Notification type',
  })
  @IsEnum(NotificationType)
  type!: NotificationType;

  @ApiProperty({
    example: true,
    description: 'Enable/disable this notification type',
  })
  @IsBoolean()
  enabled!: boolean;

  @ApiPropertyOptional({
    type: [ChannelPreferenceDto],
    description: 'Channel preferences for this type',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChannelPreferenceDto)
  channels?: ChannelPreferenceDto[];
}

/**
 * DTO for quiet hours configuration
 */
export class QuietHoursDto {
  @ApiProperty({
    example: true,
    description: 'Enable quiet hours',
  })
  @IsBoolean()
  enabled!: boolean;

  @ApiPropertyOptional({
    example: '22:00',
    description: 'Start time (HH:MM format)',
  })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({
    example: '08:00',
    description: 'End time (HH:MM format)',
  })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional({
    type: [String],
    enum: NotificationType,
    example: [NotificationType.SECURITY_ALERT, NotificationType.LAB_RESULT_CRITICAL],
    description: 'Types that ignore quiet hours',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(NotificationType, { each: true })
  excludeTypes?: NotificationType[];
}

/**
 * DTO for creating/updating notification preferences
 */
export class NotificationPreferenceDto {
  @ApiPropertyOptional({
    example: true,
    description: 'Master switch for all notifications',
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({
    type: [String],
    enum: NotificationChannel,
    example: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    description: 'Preferred channels',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  preferredChannels?: NotificationChannel[];

  @ApiPropertyOptional({
    type: [TypePreferenceDto],
    description: 'Preferences for each notification type',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TypePreferenceDto)
  typePreferences?: TypePreferenceDto[];

  @ApiPropertyOptional({
    type: QuietHoursDto,
    description: 'Quiet hours configuration',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => QuietHoursDto)
  quietHours?: QuietHoursDto;

  @ApiPropertyOptional({
    example: false,
    description: 'Enable notification digest',
  })
  @IsOptional()
  @IsBoolean()
  enableDigest?: boolean;

  @ApiPropertyOptional({
    example: 'daily',
    description: 'Digest frequency',
    enum: ['daily', 'weekly'],
  })
  @IsOptional()
  @IsEnum(['daily', 'weekly'])
  digestFrequency?: string;

  @ApiPropertyOptional({
    example: '09:00',
    description: 'Time to send digest (HH:MM format)',
  })
  @IsOptional()
  @IsString()
  digestTime?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Enable grouping of similar notifications',
  })
  @IsOptional()
  @IsBoolean()
  enableGrouping?: boolean;

  @ApiPropertyOptional({
    example: 5,
    description: 'Minimum notifications to trigger grouping',
  })
  @IsOptional()
  @IsNumber()
  @Min(2)
  groupingThreshold?: number;

  @ApiPropertyOptional({
    example: 'en',
    description: 'Preferred language code',
  })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({
    example: 'Asia/Kolkata',
    description: 'User timezone',
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({
    example: 'user@example.com',
    description: 'Email address',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    example: '+919876543210',
    description: 'Phone number',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['fcm-token-123', 'apns-token-456'],
    description: 'Device tokens for push notifications',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deviceTokens?: string[];
}
