import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// Schemas
import { Allergy, AllergySchema } from './schemas/allergy.schema';
import { ChronicCondition, ChronicConditionSchema } from './schemas/chronic-condition.schema';
import { SurgicalHistory, SurgicalHistorySchema } from './schemas/surgical-history.schema';
import { FamilyHistory, FamilyHistorySchema } from './schemas/family-history.schema';
import { Immunization, ImmunizationSchema } from './schemas/immunization.schema';
import { VitalSigns, VitalSignsSchema } from './schemas/vital-signs.schema';

// Repositories
import { AllergyRepository } from './repositories/allergy.repository';
import { ChronicConditionRepository } from './repositories/chronic-condition.repository';
import { SurgicalHistoryRepository } from './repositories/surgical-history.repository';
import { FamilyHistoryRepository } from './repositories/family-history.repository';
import { ImmunizationRepository } from './repositories/immunization.repository';
import { VitalSignsRepository } from './repositories/vital-signs.repository';

// Services
import { MedicalHistoryService } from './services/medical-history.service';

// Controller
import { MedicalHistoryController } from './medical-history.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Allergy.name, schema: AllergySchema },
      { name: ChronicCondition.name, schema: ChronicConditionSchema },
      { name: SurgicalHistory.name, schema: SurgicalHistorySchema },
      { name: FamilyHistory.name, schema: FamilyHistorySchema },
      { name: Immunization.name, schema: ImmunizationSchema },
      { name: VitalSigns.name, schema: VitalSignsSchema },
    ]),
  ],
  controllers: [MedicalHistoryController],
  providers: [
    MedicalHistoryService,
    AllergyRepository,
    ChronicConditionRepository,
    SurgicalHistoryRepository,
    FamilyHistoryRepository,
    ImmunizationRepository,
    VitalSignsRepository,
  ],
  exports: [
    MedicalHistoryService,
    AllergyRepository,
    ChronicConditionRepository,
    SurgicalHistoryRepository,
    FamilyHistoryRepository,
    ImmunizationRepository,
    VitalSignsRepository,
  ],
})
export class MedicalHistoryModule {}
