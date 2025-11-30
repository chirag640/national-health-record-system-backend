import { IsMongoId, IsArray, ArrayNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DisconnectHospitalConsentDto {
  @ApiProperty({
    description: 'ID of the Hospital record',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  hospitalId!: string;

  @ApiProperty({
    description: 'Array of Consent IDs to disconnect',
    example: ['507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  consentIds!: string[];
}
