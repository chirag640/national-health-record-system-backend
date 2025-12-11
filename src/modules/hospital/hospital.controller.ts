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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
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
  @ApiOperation({
    summary: 'Create new hospital (SuperAdmin only)',
    description:
      'SuperAdmin creates new hospital/facility in the network with complete registration details',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Hospital created successfully',
    type: HospitalOutputDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid hospital data or duplicate registration',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden - SuperAdmin only' })
  create(@Body() dto: CreateHospitalDto): Promise<HospitalOutputDto> {
    return this.hospitalService.create(dto);
  }

  @Get()
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'List all hospitals',
    description: 'Retrieve paginated list of all registered hospitals/facilities in the network',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 20)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Hospitals retrieved successfully',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.hospitalService.findAll(page, limit);
  }

  @Get(':id')
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get hospital details',
    description:
      'Retrieve detailed hospital information including address, contact, and registration details',
  })
  @ApiParam({ name: 'id', description: 'Hospital MongoDB ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Hospital details retrieved successfully',
    type: HospitalOutputDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Hospital not found' })
  findOne(@Param('id') id: string): Promise<HospitalOutputDto> {
    return this.hospitalService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Update hospital information (SuperAdmin only)',
    description: 'SuperAdmin updates hospital details, contact info, or registration status',
  })
  @ApiParam({ name: 'id', description: 'Hospital MongoDB ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Hospital updated successfully',
    type: HospitalOutputDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid update data' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden - SuperAdmin only' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Hospital not found' })
  update(@Param('id') id: string, @Body() dto: UpdateHospitalDto): Promise<HospitalOutputDto> {
    return this.hospitalService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Deactivate hospital (SuperAdmin only)',
    description:
      'Soft delete - marks hospital as inactive. Preserves all historical data and relationships.',
  })
  @ApiParam({ name: 'id', description: 'Hospital MongoDB ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Hospital deactivated successfully',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden - SuperAdmin only' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Hospital not found' })
  remove(@Param('id') id: string): Promise<void> {
    return this.hospitalService.remove(id);
  }
}
