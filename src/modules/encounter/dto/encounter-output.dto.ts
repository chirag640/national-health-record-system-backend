import { ApiProperty } from '@nestjs/swagger';

export class EncounterOutputDto {
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
    description: 'Doctor ID reference',
    example: '507f1f77bcf86cd799439011',
  })
  doctorId!: string;

  @ApiProperty({
    description: 'Hospital ID reference',
    example: '507f1f77bcf86cd799439011',
  })
  hospitalId!: string;

  @ApiProperty({
    description: 'VisitReason',
    example: 'Sample text',
  })
  visitReason!: string;

  @ApiProperty({
    description: 'Diagnosis',
    example: 'Sample text',
  })
  diagnosis!: string;

  @ApiProperty({
    description: 'prescriptions',
    example: 'null',
  })
  prescriptions!: Record<string, any>;

  @ApiProperty({
    description: 'vitals',
    example: 'null',
  })
  vitals!: Record<string, any>;

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
