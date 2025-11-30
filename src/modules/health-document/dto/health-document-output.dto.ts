import { ApiProperty } from '@nestjs/swagger';

export class HealthDocumentOutputDto {
  @ApiProperty({
    description: 'Unique identifier',
    example: '507f1f77bcf86cd799439011',
  })
  id!: string;

  @ApiProperty({
    description: 'Patient GUID reference',
    example: 'ABCD-1234-EFGH-5678',
  })
  patientId!: string;

  @ApiProperty({
    description: 'Hospital ID reference',
    example: '507f1f77bcf86cd799439011',
  })
  hospitalId!: string;

  @ApiProperty({
    description: 'Encounter ID reference (optional)',
    example: '507f1f77bcf86cd799439011',
    required: false,
  })
  encounterId?: string;

  @ApiProperty({
    description: 'DocType',
    example: 'Sample text',
  })
  docType!: string;

  @ApiProperty({
    description: 'URL address',
    example: 'https://example.com',
  })
  fileUrl!: string;

  @ApiProperty({
    description: 'metadata',
    example: 'null',
  })
  metadata!: Record<string, any>;

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
