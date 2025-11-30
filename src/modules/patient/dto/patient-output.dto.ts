import { ApiProperty } from '@nestjs/swagger';

export class PatientOutputDto {
  @ApiProperty({
    description: 'Unique identifier',
    example: '507f1f77bcf86cd799439011',
  })
  id!: string;

  @ApiProperty({
    description: 'Guid',
    example: 'Sample text',
  })
  guid!: string;

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
    description: 'gender',
    example: 'null',
  })
  gender!: string;

  @ApiProperty({
    description: 'dateOfBirth',
    example: 'null',
  })
  dateOfBirth!: Date;

  @ApiProperty({
    description: 'address',
    example: 'null',
  })
  address!: Record<string, any>;

  @ApiProperty({
    description: 'allergies',
    example: 'null',
  })
  allergies!: string[];

  @ApiProperty({
    description: 'chronicDiseases',
    example: 'null',
  })
  chronicDiseases!: string[];

  @ApiProperty({
    description: 'BloodGroup',
    example: 'Sample text',
  })
  bloodGroup!: string;

  @ApiProperty({
    description: 'emergencyContact',
    example: 'null',
  })
  emergencyContact!: Record<string, any>;

  @ApiProperty({
    description: 'HasSmartphone',
    example: true,
  })
  hasSmartphone!: boolean;

  @ApiProperty({
    description: 'Is idCardIssued',
    example: true,
  })
  idCardIssued!: boolean;

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
