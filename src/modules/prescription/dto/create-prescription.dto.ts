import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsDateString,
  IsNumber,
  IsBoolean,
  ValidateNested,
  IsArray,
  Min,
  Max,
  Length,
  ArrayMinSize,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PrescriptionStatus,
  PrescriptionIntent,
  PrescriptionPriority,
  CourseOfTherapy,
  DosageTimingCode,
  RouteOfAdministration,
} from '../schemas/prescription.schema';

export class DosageInstructionDto {
  @ApiProperty({ description: 'Order of instruction', example: 1 })
  @IsNumber()
  @Min(1)
  sequence!: number;

  @ApiProperty({
    description: 'Free text dosage instruction',
    example: 'Take 1 tablet twice daily after meals',
  })
  @IsString()
  @IsNotEmpty()
  @Length(5, 500)
  text!: string;

  @ApiPropertyOptional({
    description: 'Patient-friendly instructions',
    example: 'Take this medicine with food to avoid stomach upset',
  })
  @IsString()
  @IsOptional()
  @Length(5, 500)
  patientInstruction?: string;

  @ApiPropertyOptional({ enum: DosageTimingCode })
  @IsEnum(DosageTimingCode)
  @IsOptional()
  timing?: DosageTimingCode;

  @ApiPropertyOptional({ description: 'Take as needed (PRN)' })
  @IsBoolean()
  @IsOptional()
  asNeededBoolean?: boolean;

  @ApiPropertyOptional({ description: 'Reason for PRN use', example: 'for pain' })
  @IsString()
  @IsOptional()
  asNeededFor?: string;

  @ApiProperty({ enum: RouteOfAdministration, example: 'oral' })
  @IsEnum(RouteOfAdministration)
  @IsNotEmpty()
  route!: RouteOfAdministration;

  @ApiPropertyOptional({ example: 'swallow whole, do not crush' })
  @IsString()
  @IsOptional()
  method?: string;

  @ApiProperty({ description: 'Dose amount', example: 500 })
  @IsNumber()
  @Min(0.001)
  doseQuantityValue!: number;

  @ApiProperty({ description: 'Dose unit', example: 'mg' })
  @IsString()
  @IsNotEmpty()
  doseQuantityUnit!: string;

  @ApiPropertyOptional({ description: 'UCUM code for unit' })
  @IsString()
  @IsOptional()
  doseQuantityCode?: string;

  @ApiPropertyOptional({ description: 'Rate value (for infusions)' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  rateQuantityValue?: number;

  @ApiPropertyOptional({ description: 'Rate unit', example: 'ml/hour' })
  @IsString()
  @IsOptional()
  rateQuantityUnit?: string;

  @ApiPropertyOptional({ description: 'Maximum dose per period' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  maxDosePerPeriod?: number;

  @ApiPropertyOptional({ description: 'Period for max dose', example: 'day' })
  @IsString()
  @IsOptional()
  maxDosePerPeriodUnit?: string;

  @ApiPropertyOptional({ description: 'Treatment duration', example: 7 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  durationValue?: number;

  @ApiPropertyOptional({ description: 'Duration unit', example: 'day' })
  @IsString()
  @IsOptional()
  durationUnit?: string;

  @ApiPropertyOptional({ description: 'How many times per period', example: 2 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  frequencyValue?: number;

  @ApiPropertyOptional({ description: 'Frequency period', example: 1 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  frequencyPeriod?: number;

  @ApiPropertyOptional({ description: 'Frequency period unit', example: 'day' })
  @IsString()
  @IsOptional()
  frequencyPeriodUnit?: string;
}

export class DispenseRequestDto {
  @ApiPropertyOptional({ description: 'Prescription valid from date' })
  @IsDateString()
  @IsOptional()
  validityPeriodStart?: string;

  @ApiPropertyOptional({ description: 'Prescription expiry date' })
  @IsDateString()
  @IsOptional()
  validityPeriodEnd?: string;

  @ApiPropertyOptional({ description: 'Number of refills allowed', example: 2 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(12)
  numberOfRepeatsAllowed?: number;

  @ApiPropertyOptional({ description: 'Quantity to dispense', example: 30 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  quantityValue?: number;

  @ApiPropertyOptional({ description: 'Unit of quantity', example: 'tablets' })
  @IsString()
  @IsOptional()
  quantityUnit?: string;

  @ApiPropertyOptional({ description: 'Days of supply', example: 30 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  expectedSupplyDurationValue?: number;

  @ApiPropertyOptional({ description: 'Supply duration unit', example: 'day' })
  @IsString()
  @IsOptional()
  expectedSupplyDurationUnit?: string;

  @ApiPropertyOptional({ description: 'Preferred pharmacy/dispenser ID' })
  @IsMongoId()
  @IsOptional()
  dispenser?: string;

  @ApiPropertyOptional({ description: 'Special instructions for pharmacist' })
  @IsString()
  @IsOptional()
  @Length(0, 500)
  dispenserInstructions?: string;
}

export class SubstitutionAllowanceDto {
  @ApiProperty({ description: 'Allow generic substitution' })
  @IsBoolean()
  allowed!: boolean;

  @ApiPropertyOptional({ description: 'Reason for substitution policy' })
  @IsString()
  @IsOptional()
  @Length(0, 200)
  reason?: string;
}

export class CreatePrescriptionDto {
  @ApiPropertyOptional({ enum: PrescriptionStatus, default: PrescriptionStatus.ACTIVE })
  @IsEnum(PrescriptionStatus)
  @IsOptional()
  status?: PrescriptionStatus;

  @ApiPropertyOptional({ enum: PrescriptionIntent, default: PrescriptionIntent.ORDER })
  @IsEnum(PrescriptionIntent)
  @IsOptional()
  intent?: PrescriptionIntent;

  @ApiPropertyOptional({ enum: PrescriptionPriority, default: PrescriptionPriority.ROUTINE })
  @IsEnum(PrescriptionPriority)
  @IsOptional()
  priority?: PrescriptionPriority;

  @ApiProperty({ description: 'Patient ABDM GUID', example: 'patient-guid-123' })
  @IsString()
  @IsNotEmpty()
  patientGuid!: string;

  @ApiProperty({ description: 'Patient MongoDB ID' })
  @IsMongoId()
  @IsNotEmpty()
  patient!: string;

  @ApiProperty({ description: 'Prescribing doctor MongoDB ID' })
  @IsMongoId()
  @IsNotEmpty()
  prescriber!: string;

  @ApiPropertyOptional({ description: 'Doctor name for display' })
  @IsString()
  @IsOptional()
  prescriberName?: string;

  @ApiPropertyOptional({ description: 'Medical council registration number' })
  @IsString()
  @IsOptional()
  prescriberLicenseNumber?: string;

  @ApiPropertyOptional({ description: 'Hospital/Clinic MongoDB ID' })
  @IsMongoId()
  @IsOptional()
  organization?: string;

  @ApiPropertyOptional({ description: 'Related encounter MongoDB ID' })
  @IsMongoId()
  @IsOptional()
  encounter?: string;

  @ApiProperty({ description: 'Medication brand or generic name', example: 'Amoxicillin' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 200)
  medicationName!: string;

  @ApiPropertyOptional({ description: 'Standard medication code (SNOMED/RxNorm)' })
  @IsString()
  @IsOptional()
  medicationCode?: string;

  @ApiPropertyOptional({ description: 'Code system used', example: 'SNOMED-CT' })
  @IsString()
  @IsOptional()
  medicationCodeSystem?: string;

  @ApiPropertyOptional({ description: 'Generic/scientific name' })
  @IsString()
  @IsOptional()
  @Length(0, 200)
  genericName?: string;

  @ApiPropertyOptional({ description: 'Manufacturer name' })
  @IsString()
  @IsOptional()
  manufacturer?: string;

  @ApiPropertyOptional({ description: 'Dosage form', example: 'tablet' })
  @IsString()
  @IsOptional()
  form?: string;

  @ApiPropertyOptional({ description: 'Medication strength', example: '500mg' })
  @IsString()
  @IsOptional()
  strength?: string;

  @ApiProperty({ type: [DosageInstructionDto], description: 'Dosage instructions' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DosageInstructionDto)
  dosageInstruction!: DosageInstructionDto[];

  @ApiPropertyOptional({ description: 'Additional instructions for patient' })
  @IsString()
  @IsOptional()
  @Length(0, 1000)
  additionalInstructions?: string;

  @ApiPropertyOptional({ enum: CourseOfTherapy })
  @IsEnum(CourseOfTherapy)
  @IsOptional()
  courseOfTherapy?: CourseOfTherapy;

  @ApiPropertyOptional({ description: 'Diagnosis/condition code' })
  @IsString()
  @IsOptional()
  reasonCode?: string;

  @ApiPropertyOptional({ description: 'Reason for prescription', example: 'Bacterial infection' })
  @IsString()
  @IsOptional()
  @Length(0, 500)
  reasonText?: string;

  @ApiPropertyOptional({ type: [String], description: 'Reference to diagnosis documents' })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  reasonReference?: string[];

  @ApiProperty({ description: 'Date prescription was written' })
  @IsDateString()
  @IsNotEmpty()
  authoredOn!: string;

  @ApiPropertyOptional({ description: 'When to start medication' })
  @IsDateString()
  @IsOptional()
  effectivePeriodStart?: string;

  @ApiPropertyOptional({ description: 'When to stop medication' })
  @IsDateString()
  @IsOptional()
  effectivePeriodEnd?: string;

  @ApiPropertyOptional({ type: DispenseRequestDto })
  @ValidateNested()
  @Type(() => DispenseRequestDto)
  @IsOptional()
  dispenseRequest?: DispenseRequestDto;

  @ApiPropertyOptional({ type: SubstitutionAllowanceDto })
  @ValidateNested()
  @Type(() => SubstitutionAllowanceDto)
  @IsOptional()
  substitution?: SubstitutionAllowanceDto;

  @ApiPropertyOptional({ description: 'Prior prescription being replaced' })
  @IsMongoId()
  @IsOptional()
  priorPrescription?: string;

  @ApiPropertyOptional({ type: [String], description: 'Drug warnings' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  warnings?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Drug interactions' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  interactions?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Patient allergies checked' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allergiesConsidered?: string[];

  @ApiPropertyOptional({ description: 'Notes for pharmacist' })
  @IsString()
  @IsOptional()
  @Length(0, 1000)
  pharmacistNotes?: string;

  @ApiPropertyOptional({ description: 'Notes for patient' })
  @IsString()
  @IsOptional()
  @Length(0, 1000)
  patientNotes?: string;

  @ApiPropertyOptional({ type: [String], description: 'Tags for categorization' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Is this a controlled substance' })
  @IsBoolean()
  @IsOptional()
  isControlledSubstance?: boolean;

  @ApiPropertyOptional({ description: 'DEA schedule (I-V)', example: 'III' })
  @IsString()
  @IsOptional()
  controlledSubstanceSchedule?: string;

  @ApiPropertyOptional({ description: 'Requires insurance preauthorization' })
  @IsBoolean()
  @IsOptional()
  requiresPreauthorization?: boolean;

  @ApiPropertyOptional({ description: 'Preauthorization number' })
  @IsString()
  @IsOptional()
  preauthorizationNumber?: string;

  @ApiPropertyOptional({ description: 'Enable medication reminders' })
  @IsBoolean()
  @IsOptional()
  reminderEnabled?: boolean;
}
