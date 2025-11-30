import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Patient, PatientSchema } from './schemas/patient.schema';
import { PatientController } from './patient.controller';
import { PatientService } from './patient.service';
import { PatientRepository } from './patient.repository';

@Module({
  imports: [MongooseModule.forFeature([{ name: Patient.name, schema: PatientSchema }])],
  controllers: [PatientController],
  providers: [PatientService, PatientRepository],
  exports: [PatientService],
})
export class PatientModule {}
