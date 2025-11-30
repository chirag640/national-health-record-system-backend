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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConsentService } from './consent.service';
import { CreateConsentDto } from './dto/create-consent.dto';
import { UpdateConsentDto } from './dto/update-consent.dto';
import { ConsentOutputDto } from './dto/consent-output.dto';
import { EmergencyConsentOverrideDto } from './dto/emergency-consent-override.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/schemas/user.schema';

@ApiTags('Consents')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'consents', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConsentController {
  constructor(private readonly consentService: ConsentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.PATIENT, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({
    summary: 'Grant consent',
    description: 'Patient grants access to doctor/hospital. Admin can grant in emergency with OTP.',
  })
  create(@Body() dto: CreateConsentDto): Promise<ConsentOutputDto> {
    return this.consentService.create(dto);
  }

  @Get()
  @Roles(UserRole.PATIENT, UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'List consents',
    description: 'Patient sees own consents. Doctor sees granted consents. Admin sees all.',
  })
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.consentService.findAll(page, limit);
  }

  @Get(':id')
  @Roles(UserRole.PATIENT, UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get consent details' })
  findOne(@Param('id') id: string): Promise<ConsentOutputDto> {
    return this.consentService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.PATIENT, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({
    summary: 'Update consent (extend expiry or modify scope)',
    description: 'Patient can modify own consents. Admin for emergency extensions.',
  })
  update(@Param('id') id: string, @Body() dto: UpdateConsentDto): Promise<ConsentOutputDto> {
    return this.consentService.update(id, dto);
  }

  @Post('emergency/request-otp')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Request OTP for emergency consent override',
    description:
      'Hospital admin requests OTP to approve emergency access. OTP sent to registered email/phone.',
  })
  @ApiResponse({
    status: 200,
    description: 'OTP sent successfully',
    schema: {
      properties: {
        message: {
          type: 'string',
          example: 'OTP sent to admin@hospital.com. Valid for 10 minutes.',
        },
        expiresAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  async requestEmergencyOtp(@Body('adminId') adminId: string) {
    return this.consentService.requestEmergencyOtp(adminId);
  }

  @Post('emergency/verify-otp')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Verify OTP for emergency consent override',
    description: 'Validates OTP before allowing emergency access creation.',
  })
  @ApiResponse({
    status: 200,
    description: 'OTP verified successfully',
    schema: {
      properties: {
        verified: { type: 'boolean', example: true },
        message: { type: 'string', example: 'OTP verified successfully' },
      },
    },
  })
  async verifyEmergencyOtp(@Body('adminId') adminId: string, @Body('otp') otp: string) {
    const verified = await this.consentService.verifyEmergencyOtp(adminId, otp);
    return {
      verified,
      message: 'OTP verified successfully',
    };
  }

  @Post('emergency/override')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Create emergency consent override (requires OTP verification)',
    description:
      'Creates temporary 1-hour consent for critical situations. Requires admin approval + OTP. ' +
      'Workflow: 1) Request OTP, 2) Verify OTP, 3) Create override with detailed justification. ' +
      'All emergency overrides are logged in audit trail for compliance.',
  })
  @ApiResponse({
    status: 201,
    description: 'Emergency consent created successfully',
    type: ConsentOutputDto,
  })
  async createEmergencyOverride(
    @Body() dto: EmergencyConsentOverrideDto,
  ): Promise<ConsentOutputDto> {
    return this.consentService.createEmergencyOverride(dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.PATIENT, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Revoke consent',
    description: 'Patient can revoke anytime. SuperAdmin for legal compliance.',
  })
  remove(@Param('id') id: string): Promise<void> {
    return this.consentService.remove(id);
  }
}
