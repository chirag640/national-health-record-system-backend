import { ApiProperty } from '@nestjs/swagger';

export class HospitalOutputDto {
  @ApiProperty({
    description: 'Unique identifier',
    example: '507f1f77bcf86cd799439011',
  })
  id!: string;

  @ApiProperty({
    description: 'Name',
    example: 'Sample Name',
  })
  name!: string;

  @ApiProperty({
    description: 'State',
    example: 'Sample text',
  })
  state!: string;

  @ApiProperty({
    description: 'District',
    example: 'Sample text',
  })
  district!: string;

  @ApiProperty({
    description: 'hospitalType',
    example: 'null',
  })
  hospitalType!: string;

  @ApiProperty({
    description: 'IsActive',
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
