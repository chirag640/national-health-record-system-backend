import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { HospitalService } from './hospital.service';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';
import { HospitalOutputDto } from './dto/hospital-output.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/schemas/user.schema';

@ApiTags('Hospitals')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'hospitals', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class HospitalController {
  constructor(private readonly hospitalService: HospitalService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create new hospital (SuperAdmin only)' })
  create(@Body() dto: CreateHospitalDto): Promise<HospitalOutputDto> {
    return this.hospitalService.create(dto);
  }

  @Get()
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all hospitals' })
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.hospitalService.findAll(page, limit);
  }

  @Get(':id')
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get hospital details' })
  findOne(@Param('id') id: string): Promise<HospitalOutputDto> {
    return this.hospitalService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update hospital information (SuperAdmin only)' })
  update(@Param('id') id: string, @Body() dto: UpdateHospitalDto): Promise<HospitalOutputDto> {
    return this.hospitalService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Deactivate hospital (SuperAdmin only)' })
  remove(@Param('id') id: string): Promise<void> {
    return this.hospitalService.remove(id);
  }
}
