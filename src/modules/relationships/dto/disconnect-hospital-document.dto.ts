import { IsMongoId, IsArray, ArrayNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DisconnectHospitalDocumentDto {
  @ApiProperty({
    description: 'ID of the Hospital record',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  hospitalId!: string;

  @ApiProperty({
    description: 'Array of Document IDs to disconnect',
    example: ['507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  documentIds!: string[];
}
