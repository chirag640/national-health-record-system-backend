import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';

@Module({
  imports: [
    TerminusModule,
    // Note: MongooseModule.forRoot should already be imported in AppModule
    // The health indicator will use the existing connection
  ],
  controllers: [HealthController],
})
export class HealthModule {}
