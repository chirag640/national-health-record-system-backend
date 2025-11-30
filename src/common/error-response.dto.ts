import { ApiProperty } from '@nestjs/swagger';

/**
 * Standard error response structure
 * Used across all API endpoints for consistent error handling
 */
export class ErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 400,
  })
  statusCode!: number;

  @ApiProperty({
    description: 'Error message or array of validation errors',
    example: ['email must be a valid email address'],
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  message!: string | string[];

  @ApiProperty({
    description: 'Error type',
    example: 'Bad Request',
  })
  error!: string;

  @ApiProperty({
    description: 'Timestamp of the error',
    example: '2024-01-01T00:00:00.000Z',
  })
  timestamp!: string;

  @ApiProperty({
    description: 'Request path that caused the error',
    example: '/api/users/123',
  })
  path!: string;
}
