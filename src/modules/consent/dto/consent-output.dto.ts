import { ApiProperty } from '@nestjs/swagger';

export class ConsentOutputDto {
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
    description: 'Doctor ID reference (optional)',
    example: '507f1f77bcf86cd799439011',
    required: false,
  })
  doctorId?: string;

  @ApiProperty({
    description: 'Hospital ID reference (optional)',
    example: '507f1f77bcf86cd799439011',
    required: false,
  })
  hospitalId?: string;

  @ApiProperty({
    description: 'scope',
    example: 'null',
  })
  scope!: string[];

  @ApiProperty({
    description: 'expiresAt',
    example: 'null',
  })
  expiresAt!: Date;

  @ApiProperty({
    description: 'Is consent active',
    example: true,
  })
  isActive!: boolean;

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
