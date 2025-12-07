import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsBoolean,
  IsDate,
  IsObject,
  IsMongoId,
  ValidateNested,
  ArrayMinSize,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  NotificationType,
  NotificationPriority,
  NotificationChannel,
} from '../schemas/notification.schema';

/**
 * DTO for Action Button
 */
export class ActionButtonDto {
  @ApiProperty({ example: 'View Prescription', description: 'Button label' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  label!: string;

  @ApiProperty({ example: 'view_prescription', description: 'Action identifier' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  action!: string;

  @ApiPropertyOptional({ example: { prescriptionId: '123' }, description: 'Action data' })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @ApiPropertyOptional({
    example: 'primary',
    description: 'Button style',
    enum: ['primary', 'secondary', 'danger'],
  })
  @IsOptional()
  @IsString()
  style?: string;
}

/**
 * DTO for creating a notification
 */
export class CreateNotificationDto {
  @ApiProperty({
    enum: NotificationType,
    example: NotificationType.PRESCRIPTION_EXPIRING,
    description: 'Type of notification',
  })
  @IsEnum(NotificationType)
  type!: NotificationType;

  @ApiProperty({
    enum: NotificationPriority,
    example: NotificationPriority.HIGH,
    description: 'Priority level',
  })
  @IsEnum(NotificationPriority)
  priority!: NotificationPriority;

  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Recipient user ID',
  })
  @IsMongoId()
  recipientId!: string;

  @ApiPropertyOptional({ example: 'user@example.com', description: 'Recipient email' })
  @IsOptional()
  @IsString()
  recipientEmail?: string;

  @ApiPropertyOptional({ example: '+919876543210', description: 'Recipient phone' })
  @IsOptional()
  @IsString()
  recipientPhone?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['fcm-token-123'],
    description: 'Device tokens for push notifications',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recipientDeviceTokens?: string[];

  @ApiProperty({
    example: 'Prescription Expiring Soon',
    description: 'Notification title',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiProperty({
    example: 'Your prescription for Amoxicillin will expire in 3 days.',
    description: 'Notification message',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  message!: string;

  @ApiPropertyOptional({
    example: 'Prescription expiring in 3 days',
    description: 'Short message for SMS',
  })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  shortMessage?: string;

  @ApiPropertyOptional({
    example: '507f1f77bcf86cd799439012',
    description: 'Related entity ID',
  })
  @IsOptional()
  @IsMongoId()
  relatedEntityId?: string;

  @ApiPropertyOptional({
    example: 'Prescription',
    description: 'Related entity model name',
    enum: [
      'Patient',
      'Doctor',
      'Hospital',
      'Appointment',
      'Prescription',
      'Encounter',
      'HealthDocument',
      'Consent',
    ],
  })
  @IsOptional()
  @IsString()
  relatedEntityModel?: string;

  @ApiPropertyOptional({
    example: { prescriptionNumber: 'RX-2024-000123' },
    description: 'Snapshot of related entity data',
  })
  @IsOptional()
  @IsObject()
  relatedEntityData?: Record<string, any>;

  @ApiProperty({
    type: [String],
    enum: NotificationChannel,
    example: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    description: 'Delivery channels',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(NotificationChannel, { each: true })
  channels!: NotificationChannel[];

  @ApiPropertyOptional({
    type: [ActionButtonDto],
    description: 'Action buttons',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActionButtonDto)
  actions?: ActionButtonDto[];

  @ApiPropertyOptional({
    example: 'healthapp://prescription/123',
    description: 'Deep link for mobile app',
  })
  @IsOptional()
  @IsString()
  deepLink?: string;

  @ApiPropertyOptional({
    example: 'https://app.example.com/prescriptions/123',
    description: 'Web link',
  })
  @IsOptional()
  @IsString()
  webLink?: string;

  @ApiPropertyOptional({
    type: Date,
    example: '2024-12-08T10:00:00Z',
    description: 'Schedule notification for later',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  scheduledFor?: Date;

  @ApiPropertyOptional({
    type: Date,
    example: '2024-12-15T10:00:00Z',
    description: 'Expiration date',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiresAt?: Date;

  @ApiPropertyOptional({
    example: 'prescriptions',
    description: 'Category for grouping',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    example: 'prescription-expiry-user-123',
    description: 'Group key for collapsing similar notifications',
  })
  @IsOptional()
  @IsString()
  groupKey?: string;

  @ApiPropertyOptional({
    example: { customField: 'value' },
    description: 'Additional metadata',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/images/prescription.png',
    description: 'Image URL',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/icons/prescription.png',
    description: 'Icon URL',
  })
  @IsOptional()
  @IsString()
  iconUrl?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Can user dismiss this notification',
  })
  @IsOptional()
  @IsBoolean()
  canDismiss?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Requires user acknowledgment',
  })
  @IsOptional()
  @IsBoolean()
  requiresAcknowledgment?: boolean;

  @ApiPropertyOptional({
    example: '507f1f77bcf86cd799439013',
    description: 'Sender user ID',
  })
  @IsOptional()
  @IsMongoId()
  senderId?: string;

  @ApiPropertyOptional({
    example: 'Dr. John Doe',
    description: 'Sender name',
  })
  @IsOptional()
  @IsString()
  senderName?: string;
}

/**
 * DTO for bulk notification creation
 */
export class CreateBulkNotificationDto {
  @ApiProperty({
    type: [String],
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    description: 'List of recipient user IDs',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  recipientIds!: string[];

  @ApiProperty({
    enum: NotificationType,
    example: NotificationType.SYSTEM_ALERT,
    description: 'Type of notification',
  })
  @IsEnum(NotificationType)
  type!: NotificationType;

  @ApiProperty({
    enum: NotificationPriority,
    example: NotificationPriority.NORMAL,
    description: 'Priority level',
  })
  @IsEnum(NotificationPriority)
  priority!: NotificationPriority;

  @ApiProperty({
    example: 'System Maintenance',
    description: 'Notification title',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiProperty({
    example: 'System will be under maintenance from 2 AM to 4 AM.',
    description: 'Notification message',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  message!: string;

  @ApiProperty({
    type: [String],
    enum: NotificationChannel,
    example: [NotificationChannel.IN_APP],
    description: 'Delivery channels',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(NotificationChannel, { each: true })
  channels!: NotificationChannel[];

  @ApiPropertyOptional({
    example: 'system',
    description: 'Category for grouping',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    type: Date,
    example: '2024-12-08T10:00:00Z',
    description: 'Schedule notification for later',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  scheduledFor?: Date;
}
