import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Patient, PatientSchema } from './schemas/patient.schema';
import { PatientController } from './patient.controller';
import { PatientVerificationController } from './patient-verification.controller';
import { PatientService } from './patient.service';
import { PatientRepository } from './patient.repository';
import { PatientIdCardService } from './patient-id-card.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Patient.name, schema: PatientSchema }])],
  controllers: [PatientController, PatientVerificationController],
  providers: [PatientService, PatientRepository, PatientIdCardService],
  exports: [PatientService],
})
export class PatientModule {}
