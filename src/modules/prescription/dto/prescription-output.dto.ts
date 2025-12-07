import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PrescriptionStatus,
  PrescriptionIntent,
  PrescriptionPriority,
  CourseOfTherapy,
} from '../schemas/prescription.schema';

export class DosageInstructionOutputDto {
  @ApiProperty()
  sequence!: number;

  @ApiProperty()
  text!: string;

  @ApiPropertyOptional()
  patientInstruction?: string;

  @ApiPropertyOptional()
  timing?: string;

  @ApiPropertyOptional()
  asNeededBoolean?: boolean;

  @ApiPropertyOptional()
  asNeededFor?: string;

  @ApiProperty()
  route!: string;

  @ApiPropertyOptional()
  method?: string;

  @ApiProperty()
  doseQuantityValue!: number;

  @ApiProperty()
  doseQuantityUnit!: string;

  @ApiPropertyOptional()
  maxDosePerPeriod?: number;

  @ApiPropertyOptional()
  maxDosePerPeriodUnit?: string;

  @ApiPropertyOptional()
  durationValue?: number;

  @ApiPropertyOptional()
  durationUnit?: string;

  @ApiPropertyOptional()
  frequencyValue?: number;

  @ApiPropertyOptional()
  frequencyPeriod?: number;

  @ApiPropertyOptional()
  frequencyPeriodUnit?: string;
}

export class DispenseRequestOutputDto {
  @ApiPropertyOptional()
  validityPeriodStart?: Date;

  @ApiPropertyOptional()
  validityPeriodEnd?: Date;

  @ApiProperty()
  numberOfRepeatsAllowed!: number;

  @ApiPropertyOptional()
  quantityValue?: number;

  @ApiPropertyOptional()
  quantityUnit?: string;

  @ApiPropertyOptional()
  expectedSupplyDurationValue?: number;

  @ApiPropertyOptional()
  expectedSupplyDurationUnit?: string;

  @ApiPropertyOptional()
  dispenser?: string;

  @ApiPropertyOptional()
  dispenserInstructions?: string;
}

export class PrescriptionOutputDto {
  @ApiProperty()
  _id!: string;

  @ApiProperty()
  prescriptionNumber!: string;

  @ApiProperty({ enum: PrescriptionStatus })
  status!: PrescriptionStatus;

  @ApiPropertyOptional()
  statusReason?: string;

  @ApiPropertyOptional()
  statusChanged?: Date;

  @ApiProperty({ enum: PrescriptionIntent })
  intent!: PrescriptionIntent;

  @ApiProperty({ enum: PrescriptionPriority })
  priority!: PrescriptionPriority;

  @ApiProperty()
  patientGuid!: string;

  @ApiProperty()
  patient!: string;

  @ApiProperty()
  prescriber!: string;

  @ApiPropertyOptional()
  prescriberName?: string;

  @ApiPropertyOptional()
  prescriberLicenseNumber?: string;

  @ApiPropertyOptional()
  organization?: string;

  @ApiPropertyOptional()
  encounter?: string;

  @ApiProperty()
  medicationName!: string;

  @ApiPropertyOptional()
  medicationCode?: string;

  @ApiPropertyOptional()
  genericName?: string;

  @ApiPropertyOptional()
  manufacturer?: string;

  @ApiPropertyOptional()
  form?: string;

  @ApiPropertyOptional()
  strength?: string;

  @ApiProperty({ type: [DosageInstructionOutputDto] })
  dosageInstruction!: DosageInstructionOutputDto[];

  @ApiPropertyOptional()
  additionalInstructions?: string;

  @ApiPropertyOptional({ enum: CourseOfTherapy })
  courseOfTherapy?: CourseOfTherapy;

  @ApiPropertyOptional()
  reasonCode?: string;

  @ApiPropertyOptional()
  reasonText?: string;

  @ApiProperty()
  authoredOn!: Date;

  @ApiPropertyOptional()
  effectivePeriodStart?: Date;

  @ApiPropertyOptional()
  effectivePeriodEnd?: Date;

  @ApiPropertyOptional({ type: DispenseRequestOutputDto })
  dispenseRequest?: DispenseRequestOutputDto;

  @ApiPropertyOptional()
  priorPrescription?: string;

  @ApiPropertyOptional({ type: [String] })
  warnings?: string[];

  @ApiPropertyOptional({ type: [String] })
  interactions?: string[];

  @ApiProperty()
  isControlledSubstance!: boolean;

  @ApiPropertyOptional()
  controlledSubstanceSchedule?: string;

  @ApiProperty()
  dispensedCount!: number;

  @ApiPropertyOptional()
  lastDispensedDate?: Date;

  @ApiPropertyOptional()
  isExpired?: boolean;

  @ApiPropertyOptional()
  refillsRemaining?: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class PrescriptionListOutputDto {
  @ApiProperty({ type: [PrescriptionOutputDto] })
  data!: PrescriptionOutputDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  totalPages!: number;
}
