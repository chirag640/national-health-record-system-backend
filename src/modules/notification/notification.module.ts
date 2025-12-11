import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationRepository } from './notification.repository';
import { NotificationPreferenceRepository } from './notification-preference.repository';
import { Notification, NotificationSchema } from './schemas/notification.schema';
import {
  NotificationPreference,
  NotificationPreferenceSchema,
} from './schemas/notification-preference.schema';
import { QueueModule } from '../queue/queue.module';
import { FirebaseService } from './services/firebase.service';
import { SmsService } from './services/sms.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: NotificationPreference.name, schema: NotificationPreferenceSchema },
    ]),
    QueueModule, // For notification delivery
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationRepository,
    NotificationPreferenceRepository,
    FirebaseService,
    SmsService,
  ],
  exports: [
    NotificationService,
    NotificationRepository,
    NotificationPreferenceRepository,
    FirebaseService,
    SmsService,
  ],
})
export class NotificationModule {}
