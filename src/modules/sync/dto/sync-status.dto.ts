import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SyncStatusDto {
  @ApiProperty({
    description: 'Conflict resolution strategy',
    enum: ['CLIENT_WINS', 'SERVER_WINS', 'MANUAL'],
    example: 'SERVER_WINS',
    required: false,
  })
  @IsEnum(['CLIENT_WINS', 'SERVER_WINS', 'MANUAL'])
  @IsOptional()
  conflictResolution?: string;
}
