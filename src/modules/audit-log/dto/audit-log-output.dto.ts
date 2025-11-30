import { ApiProperty } from '@nestjs/swagger';

export class AuditLogOutputDto {
  @ApiProperty({
    description: 'Unique identifier',
    example: '507f1f77bcf86cd799439011',
  })
  id!: string;

  @ApiProperty({
    description: 'UserId',
    example: 'Sample text',
  })
  userId!: string;

  @ApiProperty({
    description: 'Action',
    example: 'Sample text',
  })
  action!: string;

  @ApiProperty({
    description: 'Resource',
    example: 'Sample text',
  })
  resource!: string;

  @ApiProperty({
    description: 'ResourceId',
    example: 'Sample text',
  })
  resourceId!: string;

  @ApiProperty({
    description: 'Physical address',
    example: '123 Main St, City, State 12345',
  })
  ipAddress!: string;

  @ApiProperty({
    description: 'details',
    example: 'null',
  })
  details!: Record<string, any>;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt!: Date;
}
