import { Module, Global } from '@nestjs/common';
import { ErrorTrackingService, GlobalExceptionFilter } from './error-tracking.service';
import { SecurityModule } from '../security/security.module';

@Global()
@Module({
  imports: [SecurityModule],
  providers: [
    ErrorTrackingService,
    {
      provide: 'APP_FILTER',
      useClass: GlobalExceptionFilter,
    },
  ],
  exports: [ErrorTrackingService],
})
export class MonitoringModule {}
