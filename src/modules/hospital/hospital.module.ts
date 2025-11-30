import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Hospital, HospitalSchema } from './schemas/hospital.schema';
import { HospitalController } from './hospital.controller';
import { HospitalService } from './hospital.service';
import { HospitalRepository } from './hospital.repository';
import { Doctor, DoctorSchema } from '../doctor/schemas/doctor.schema';
import { User, UserSchema } from '../../auth/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Hospital.name, schema: HospitalSchema },
      { name: Doctor.name, schema: DoctorSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [HospitalController],
  providers: [HospitalService, HospitalRepository],
  exports: [HospitalService],
})
export class HospitalModule {}
