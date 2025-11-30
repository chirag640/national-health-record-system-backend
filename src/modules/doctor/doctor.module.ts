import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Doctor, DoctorSchema } from './schemas/doctor.schema';
import { DoctorController } from './doctor.controller';
import { DoctorService } from './doctor.service';
import { DoctorRepository } from './doctor.repository';

@Module({
  imports: [MongooseModule.forFeature([{ name: Doctor.name, schema: DoctorSchema }])],
  controllers: [DoctorController],
  providers: [DoctorService, DoctorRepository],
  exports: [DoctorService],
})
export class DoctorModule {}
