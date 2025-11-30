import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Encounter, EncounterSchema } from './schemas/encounter.schema';
import { EncounterController } from './encounter.controller';
import { EncounterService } from './encounter.service';
import { EncounterRepository } from './encounter.repository';

@Module({
  imports: [MongooseModule.forFeature([{ name: Encounter.name, schema: EncounterSchema }])],
  controllers: [EncounterController],
  providers: [EncounterService, EncounterRepository],
  exports: [EncounterService],
})
export class EncounterModule {}
