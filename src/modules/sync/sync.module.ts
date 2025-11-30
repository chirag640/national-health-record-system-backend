import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SyncQueue, SyncQueueSchema } from './schemas/sync-queue.schema';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { PatientModule } from '../patient/patient.module';
import { DoctorModule } from '../doctor/doctor.module';
import { EncounterModule } from '../encounter/encounter.module';
import { ConsentModule } from '../consent/consent.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: SyncQueue.name, schema: SyncQueueSchema }]),
    PatientModule,
    DoctorModule,
    EncounterModule,
    ConsentModule,
  ],
  controllers: [SyncController],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
