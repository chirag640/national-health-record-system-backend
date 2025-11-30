import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Hospital, HospitalSchema } from './schemas/hospital.schema';
import { HospitalController } from './hospital.controller';
import { HospitalService } from './hospital.service';
import { HospitalRepository } from './hospital.repository';

@Module({
  imports: [MongooseModule.forFeature([{ name: Hospital.name, schema: HospitalSchema }])],
  controllers: [HospitalController],
  providers: [HospitalService, HospitalRepository],
  exports: [HospitalService],
})
export class HospitalModule {}
