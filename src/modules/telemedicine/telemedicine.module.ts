import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  TelemedicineSession,
  TelemedicineSessionSchema,
} from './schemas/telemedicine-session.schema';
import { TelemedicineSessionController } from './telemedicine-session.controller';
import { TelemedicineSessionService } from './telemedicine-session.service';
import { TelemedicineSessionRepository } from './telemedicine-session.repository';
import { TwilioVideoService } from './services/twilio-video.service';
import { TelemedicineGateway } from './telemedicine.gateway';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TelemedicineSession.name, schema: TelemedicineSessionSchema },
    ]),
    NotificationModule,
  ],
  controllers: [TelemedicineSessionController],
  providers: [
    TelemedicineSessionService,
    TelemedicineSessionRepository,
    TwilioVideoService,
    TelemedicineGateway,
  ],
  exports: [TelemedicineSessionService, TelemedicineSessionRepository],
})
export class TelemedicineModule {}
