import { PartialType } from '@nestjs/swagger';
import { CreateNotificationDto } from './create-notification.dto';
import { IsEnum, IsOptional, IsDate, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationStatus } from '../schemas/notification.schema';

/**
 * DTO for updating a notification
 */
export class UpdateNotificationDto extends PartialType(CreateNotificationDto) {
  @ApiPropertyOptional({
    enum: NotificationStatus,
    example: NotificationStatus.READ,
    description: 'Update notification status',
  })
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;

  @ApiPropertyOptional({
    type: Date,
    example: '2024-12-07T14:30:00Z',
    description: 'When notification was read',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  readAt?: Date;

  @ApiPropertyOptional({
    type: Date,
    example: '2024-12-07T14:30:00Z',
    description: 'When notification was acknowledged',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  acknowledgedAt?: Date;

  @ApiPropertyOptional({
    example: 'Delivery failed due to invalid email',
    description: 'Failure reason',
  })
  @IsOptional()
  @IsString()
  failureReason?: string;
}
