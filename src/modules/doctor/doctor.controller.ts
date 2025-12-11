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
import { DoctorService } from './doctor.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { DoctorOutputDto } from './dto/doctor-output.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/schemas/user.schema';

@ApiTags('Doctors')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'doctors', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Register new doctor (Admin only)',
    description:
      'Hospital admin or super admin creates new doctor profile with credentials and specialization',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Doctor registered successfully',
    type: DoctorOutputDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid doctor data or duplicate license number',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden - Admin role required' })
  create(@Body() dto: CreateDoctorDto): Promise<DoctorOutputDto> {
    return this.doctorService.create(dto);
  }

  @Get()
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'List all doctors',
    description: 'Retrieve paginated list of all registered doctors across all hospitals',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 20)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Doctors retrieved successfully',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.doctorService.findAll(page, limit);
  }

  @Get('hospital/:hospitalId')
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Find doctors by hospital',
    description: 'Get all active doctors at a specific hospital',
  })
  @ApiParam({ name: 'hospitalId', description: 'Hospital MongoDB ID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 20)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Hospital doctors retrieved successfully',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Hospital not found' })
  findByHospital(
    @Param('hospitalId') hospitalId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.doctorService.findByHospital(hospitalId, page, limit);
  }

  @Get('search/:searchTerm')
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Search doctors by specialization, name, or license',
    description:
      'Partial match search across name, specialization, and license number. Optionally filter by hospital.',
  })
  @ApiParam({
    name: 'searchTerm',
    description: 'Search keyword for name, specialization, or license',
  })
  @ApiQuery({ name: 'hospitalId', required: false, description: 'Filter by hospital ID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 20)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Search results retrieved successfully',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  search(
    @Param('searchTerm') searchTerm: string,
    @Query('hospitalId') hospitalId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.doctorService.search(searchTerm, hospitalId, page, limit);
  }

  @Get(':id')
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get doctor details',
    description:
      'Retrieve detailed doctor profile including credentials, specialization, and hospital',
  })
  @ApiParam({ name: 'id', description: 'Doctor MongoDB ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Doctor details retrieved successfully',
    type: DoctorOutputDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Doctor not found' })
  findOne(@Param('id') id: string): Promise<DoctorOutputDto> {
    return this.doctorService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Update doctor information',
    description: 'Doctor can update own profile. Admin can update any doctor profile.',
  })
  @ApiParam({ name: 'id', description: 'Doctor MongoDB ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Doctor updated successfully',
    type: DoctorOutputDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid update data' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Cannot update other doctors',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Doctor not found' })
  update(@Param('id') id: string, @Body() dto: UpdateDoctorDto): Promise<DoctorOutputDto> {
    return this.doctorService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Deactivate doctor (Admin only)',
    description:
      'Soft delete - marks doctor as inactive. Does not delete appointments or encounters.',
  })
  @ApiParam({ name: 'id', description: 'Doctor MongoDB ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Doctor deactivated successfully',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Doctor not found' })
  remove(@Param('id') id: string): Promise<void> {
    return this.doctorService.remove(id);
  }
}
