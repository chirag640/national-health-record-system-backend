import { ApiProperty } from '@nestjs/swagger';

export class DoctorOutputDto {
  @ApiProperty({
    description: 'Unique identifier',
    example: '507f1f77bcf86cd799439011',
  })
  id!: string;

  @ApiProperty({
    description: 'Hospital ID reference',
    example: '507f1f77bcf86cd799439011',
  })
  hospitalId!: string;

  @ApiProperty({
    description: 'FullName',
    example: 'Sample Name',
  })
  fullName!: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+1234567890',
  })
  phone!: string;

  @ApiProperty({
    description: 'Specialization',
    example: 'Sample text',
  })
  specialization!: string;

  @ApiProperty({
    description: 'Medical License Number',
    example: 'MED-12345',
    required: false,
  })
  licenseNumber?: string;

  @ApiProperty({
    description: 'Is doctor active',
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
