import { PartialType } from '@nestjs/swagger';
import { CreatePrescriptionDto } from './create-prescription.dto';
import { IsEnum, IsOptional, IsDateString, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PrescriptionStatus } from '../schemas/prescription.schema';

export class UpdatePrescriptionDto extends PartialType(CreatePrescriptionDto) {
  @ApiPropertyOptional({ enum: PrescriptionStatus })
  @IsEnum(PrescriptionStatus)
  @IsOptional()
  status?: PrescriptionStatus;

  @ApiPropertyOptional({ description: 'Reason for status change' })
  @IsString()
  @IsOptional()
  statusReason?: string;

  @ApiPropertyOptional({ description: 'Date of last dispense' })
  @IsDateString()
  @IsOptional()
  lastDispensedDate?: string;
}
