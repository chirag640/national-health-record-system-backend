import { PartialType } from '@nestjs/swagger';
import { CreateLabReportDto } from './create-lab-report.dto';

/**
 * DTO for updating a lab report
 * All fields are optional (partial)
 */
export class UpdateLabReportDto extends PartialType(CreateLabReportDto) {}
