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
import { HealthDocumentService } from './health-document.service';
import { CreateHealthDocumentDto } from './dto/create-health-document.dto';
import { UpdateHealthDocumentDto } from './dto/update-health-document.dto';
import { HealthDocumentOutputDto } from './dto/health-document-output.dto';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/schemas/user.schema';

@ApiTags('Health Documents')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'health-documents', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class HealthDocumentController {
  constructor(private readonly healthDocumentService: HealthDocumentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.PATIENT, UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({
    summary: 'Upload health document',
    description:
      'Upload medical records, lab reports, prescriptions, or other health-related documents',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Document uploaded successfully',
    type: HealthDocumentOutputDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid document data or file type',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden' })
  create(@Body() dto: CreateHealthDocumentDto): Promise<HealthDocumentOutputDto> {
    return this.healthDocumentService.create(dto);
  }

  @Get()
  @Roles(UserRole.PATIENT, UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'List health documents',
    description:
      'Retrieve paginated list of health documents. Patients see own documents, doctors see shared documents.',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 20)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Documents retrieved successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.healthDocumentService.findAll(page, limit);
  }

  @Get(':id')
  @Roles(UserRole.PATIENT, UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get document details',
    description: 'Retrieve document metadata and download URL',
  })
  @ApiParam({ name: 'id', description: 'Health Document MongoDB ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Document retrieved successfully',
    type: HealthDocumentOutputDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - No access to this document',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Document not found' })
  findOne(@Param('id') id: string): Promise<HealthDocumentOutputDto> {
    return this.healthDocumentService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.PATIENT, UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({
    summary: 'Update document metadata',
    description:
      'Update document title, description, tags, or category. File itself cannot be modified.',
  })
  @ApiParam({ name: 'id', description: 'Health Document MongoDB ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Document updated successfully',
    type: HealthDocumentOutputDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid update data' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Cannot modify other users documents',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Document not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateHealthDocumentDto,
  ): Promise<HealthDocumentOutputDto> {
    return this.healthDocumentService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.PATIENT, UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Delete health document',
    description: 'Soft delete document. Patient can delete own documents. Admin for compliance.',
  })
  @ApiParam({ name: 'id', description: 'Health Document MongoDB ID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Document deleted successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Cannot delete other users documents',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Document not found' })
  remove(@Param('id') id: string): Promise<void> {
    return this.healthDocumentService.remove(id);
  }
}
