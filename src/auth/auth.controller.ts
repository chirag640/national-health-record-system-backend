import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Req,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import {
  RegisterPatientDto,
  RegisterDoctorDto,
  RegisterHospitalAdminDto,
  RegisterSuperAdminDto,
  LoginDto,
  LoginWithOtpDto,
  VerifyOtpDto,
  VerifyEmailDto,
  VerifyRegistrationOtpDto,
  ResendRegistrationOtpDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  LogoutDto,
  AuthResponseDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from './schemas/user.schema';
import { CurrentUser } from './decorators/current-user.decorator';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  /**
   * Register a new patient
   */
  @Post('register/patient')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new patient account' })
  @ApiResponse({ status: 201, description: 'Patient registered successfully' })
  async registerPatient(@Body() dto: RegisterPatientDto) {
    return this.authService.registerPatient(dto);
  }

  /**
   * Register a new doctor (Hospital Admin only)
   */
  @Post('register/doctor')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HOSPITAL_ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new doctor (Hospital Admin only)' })
  async registerDoctor(@Body() dto: RegisterDoctorDto, @CurrentUser('userId') adminId: string) {
    return this.authService.registerDoctor(dto, adminId);
  }

  /**
   * Register a new hospital admin (Super Admin only)
   */
  @Post('register/hospital-admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new hospital admin (Super Admin only)' })
  async registerHospitalAdmin(
    @Body() dto: RegisterHospitalAdminDto,
    @CurrentUser('userId') superAdminId: string,
  ) {
    return this.authService.registerHospitalAdmin(dto, superAdminId);
  }

  /**
   * Register a super admin (requires secret key)
   */
  @Post('register/super-admin')
  @Throttle({ default: { limit: 1, ttl: 3600000 } }) // 1 request per hour
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register super admin (restricted - requires secret key)' })
  async registerSuperAdmin(
    @Body() dto: RegisterSuperAdminDto,
    @Headers('x-super-admin-secret') secretKey: string,
  ) {
    return this.authService.registerSuperAdmin(dto, secretKey);
  }

  /**
   * Verify email address
   */
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  /**
   * Login with email and password
   */
  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async login(@Body() dto: LoginDto, @Req() req: Request): Promise<AuthResponseDto> {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.authService.login(dto, ipAddress, userAgent);
  }

  /**
   * Request OTP for login (Patient only - alternative login method)
   */
  @Post('login/request-otp')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request OTP for email-based login (Patient only)' })
  async requestLoginOtp(@Body() dto: LoginWithOtpDto, @Req() req: Request) {
    return this.authService.requestLoginOtp(dto.email, dto.role, req.ip, req.headers['user-agent']);
  }

  /**
   * Verify OTP and login
   */
  @Post('login/verify-otp')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and complete login' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async verifyOtpLogin(@Body() dto: VerifyOtpDto, @Req() req: Request): Promise<AuthResponseDto> {
    return this.authService.loginWithOtp(
      dto.email,
      dto.otp,
      dto.purpose as any, // role passed in purpose field
      req.ip,
      req.headers['user-agent'],
    );
  }

  /**
   * Refresh access token
   */
  @Post('refresh')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async refreshToken(@Body() dto: RefreshTokenDto, @Req() req: Request): Promise<AuthResponseDto> {
    return this.authService.refreshAccessToken(dto.refreshToken, req.ip, req.headers['user-agent']);
  }

  /**
   * Logout
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  async logout(@Body() dto: LogoutDto) {
    return this.authService.logout(dto.refreshToken);
  }

  /**
   * Request password reset
   */
  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset email' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  /**
   * Reset password
   */
  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  /**
   * Verify registration OTP
   */
  @Post('verify-registration-otp')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with OTP code after registration' })
  async verifyRegistrationOtp(@Body() dto: VerifyRegistrationOtpDto) {
    return this.authService.verifyRegistrationOtp(dto.email, dto.otp);
  }

  /**
   * Resend registration OTP
   */
  @Post('resend-registration-otp')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend OTP code for email verification' })
  async resendRegistrationOtp(@Body() dto: ResendRegistrationOtpDto) {
    return this.authService.resendRegistrationOtp(dto.email);
  }

  /**
   * Get current user profile
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  async getCurrentUser(@CurrentUser() user: any) {
    return {
      userId: user.userId,
      email: user.email,
      role: user.role,
      hospitalId: user.hospitalId,
      patientId: user.patientId,
      doctorId: user.doctorId,
      permissions: user.permissions,
    };
  }
}
