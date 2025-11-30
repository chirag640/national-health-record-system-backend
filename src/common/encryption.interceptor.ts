import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EncryptionService } from './encryption.service';
import { Reflector } from '@nestjs/core';

/**
 * Custom decorator to mark which fields should be encrypted
 *
 * @example
 * @Encrypt(['healthHistory', 'allergies', 'medications'])
 * @Get(':id')
 * async findOne(@Param('id') id: string) {
 *   return this.service.findOne(id);
 * }
 */
export const Encrypt = (fields: string[]) => {
  return (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('encrypt_fields', fields, descriptor.value);
    return descriptor;
  };
};

/**
 * Encryption Interceptor
 *
 * Automatically encrypts/decrypts sensitive fields based on @Encrypt() decorator.
 *
 * Features:
 * - Encrypts data before write operations (POST, PUT, PATCH)
 * - Decrypts data after read operations (GET)
 * - Works with single records and arrays
 * - Handles nested objects
 * - Skips encryption if disabled
 *
 * Usage:
 *
 * Option 1: Global (all routes)
 * ```
 * app.useGlobalInterceptors(new EncryptionInterceptor(encryptionService, reflector));
 * ```
 *
 * Option 2: Per controller
 * ```
 * @UseInterceptors(EncryptionInterceptor)
 * @Controller('workers')
 * export class WorkersController {}
 * ```
 *
 * Option 3: Per route with field specification
 * ```
 * @Encrypt(['healthHistory', 'allergies'])
 * @Get(':id')
 * async findOne(@Param('id') id: string) {}
 * ```
 *
 * @example
 * // Controller
 * @Controller('workers')
 * export class WorkersController {
 *   @Encrypt(['healthHistory', 'allergies', 'medications'])
 *   @Get(':id')
 *   async findOne(@Param('id') id: string) {
 *     return this.service.findOne(id); // Returns encrypted data from DB
 *     // Interceptor automatically decrypts before sending response
 *   }
 *
 *   @Encrypt(['healthHistory', 'allergies', 'medications'])
 *   @Post()
 *   async create(@Body() data: CreateWorkerDto) {
 *     // Interceptor automatically encrypts before passing to service
 *     return this.service.create(data);
 *   }
 * }
 */
@Injectable()
export class EncryptionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(EncryptionInterceptor.name);

  constructor(
    private readonly encryptionService: EncryptionService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    if (!this.encryptionService.isEnabled()) {
      return next.handle();
    }

    const handler = context.getHandler();
    const sensitiveFields =
      this.reflector.get<string[]>('encrypt_fields', handler) ||
      Reflect.getMetadata('encrypt_fields', handler);

    if (!sensitiveFields || sensitiveFields.length === 0) {
      // No fields to encrypt/decrypt
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // Encrypt request body for write operations
    if (['POST', 'PUT', 'PATCH'].includes(method) && request.body) {
      try {
        if (Array.isArray(request.body)) {
          request.body = await this.encryptionService.encryptRecords(request.body, sensitiveFields);
        } else {
          request.body = await this.encryptionService.encryptRecord(request.body, sensitiveFields);
        }
      } catch (error) {
        const err = error as Error;
        this.logger.error('Failed to encrypt request body', err.stack);
        throw error;
      }
    }

    // Decrypt response data for read operations
    return next.handle().pipe(
      map(async (data) => {
        if (!data) {
          return data;
        }

        try {
          if (Array.isArray(data)) {
            return await this.encryptionService.decryptRecords(data, sensitiveFields);
          } else if (typeof data === 'object') {
            return await this.encryptionService.decryptRecord(data, sensitiveFields);
          }
          return data;
        } catch (error) {
          const err = error as Error;
          this.logger.error('Failed to decrypt response data', err.stack);
          throw error;
        }
      }),
    );
  }
}
