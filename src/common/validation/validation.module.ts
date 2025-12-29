import { Module, Global } from '@nestjs/common';
import {
  EnhancedValidationPipe,
  InputSanitizationInterceptor,
  ParseObjectIdPipe,
  ParseUUIDPipe,
} from './validation.pipe';

@Global()
@Module({
  providers: [
    EnhancedValidationPipe,
    InputSanitizationInterceptor,
    ParseObjectIdPipe,
    ParseUUIDPipe,
  ],
  exports: [EnhancedValidationPipe, InputSanitizationInterceptor, ParseObjectIdPipe, ParseUUIDPipe],
})
export class ValidationModule {}
