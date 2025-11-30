import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { User, UserDocument, UserRole } from './schemas/user.schema';
import { OtpService } from './otp.service';
import { SessionService } from './session.service';
import { EmailService } from '../email/email.service';
import { OtpPurpose } from './schemas/otp.schema';
import {
  RegisterPatientDto,
  RegisterDoctorDto,
  RegisterHospitalAdminDto,
  RegisterSuperAdminDto,
  LoginDto,
  AuthResponseDto,
} from './dto/auth.dto';
import { Doctor, DoctorDocument } from '../modules/doctor/schemas/doctor.schema';

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  hospitalId?: string;
  patientId?: string;
  doctorId?: string;
  permissions: string[];
  sessionId: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCK_TIME = 30 * 60 * 1000; // 30 minutes

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Doctor.name) private doctorModel: Model<DoctorDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private otpService: OtpService,
    private sessionService: SessionService,
    private emailService: EmailService,
  ) {}

  /**
   * Register a new patient
   */
  async registerPatient(dto: RegisterPatientDto): Promise<{ userId: string; message: string }> {
    const existingUser = await this.userModel.findOne({ email: dto.email.toLowerCase() });
    if (existingUser) {
      throw new ConflictException({
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'An account with this email already exists',
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Generate verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpiry = new Date();
    emailVerificationExpiry.setHours(emailVerificationExpiry.getHours() + 24);

    // Create user
    const user = await this.userModel.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      role: UserRole.PATIENT,
      fullName: dto.fullName,
      emailVerificationToken,
      emailVerificationExpiry,
      emailVerified: false,
    });

    // Send verification email
    await this.emailService.sendEmailVerification({
      to: user.email,
      name: dto.fullName,
      verificationToken: emailVerificationToken,
    });

    this.logger.log(`Patient registered: ${user.email}`);

    return {
      userId: user._id.toString(),
      message: 'Registration successful. Please check your email to verify your account.',
    };
  }

  /**
   * Register a new doctor (by HospitalAdmin)
   */
  async registerDoctor(
    dto: RegisterDoctorDto,
    adminUserId: string,
  ): Promise<{ userId: string; doctorId: string; message: string }> {
    // Verify admin
    const admin = await this.userModel.findById(adminUserId);
    if (!admin || admin.role !== UserRole.HOSPITAL_ADMIN) {
      throw new UnauthorizedException('Only hospital admins can register doctors');
    }

    if (admin.hospitalId?.toString() !== dto.hospitalId) {
      throw new UnauthorizedException('You can only register doctors for your hospital');
    }

    const existingUser = await this.userModel.findOne({ email: dto.email.toLowerCase() });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Create doctor document first
    const doctor = await this.doctorModel.create({
      hospitalId: new Types.ObjectId(dto.hospitalId),
      fullName: dto.fullName,
      phone: dto.phone,
      specialization: dto.specialization,
      licenseNumber: dto.licenseNumber,
      isActive: true,
    });

    // Generate verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpiry = new Date();
    emailVerificationExpiry.setHours(emailVerificationExpiry.getHours() + 24);

    // Create user account
    const user = await this.userModel.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      role: UserRole.DOCTOR,
      fullName: dto.fullName,
      hospitalId: new Types.ObjectId(dto.hospitalId),
      doctorId: doctor._id,
      emailVerificationToken,
      emailVerificationExpiry,
      emailVerified: false,
    });

    // Send verification email
    await this.emailService.sendEmailVerification({
      to: user.email,
      name: dto.fullName,
      verificationToken: emailVerificationToken,
    });

    this.logger.log(`Doctor registered: ${user.email} at hospital ${dto.hospitalId}`);

    return {
      userId: user._id.toString(),
      doctorId: doctor._id.toString(),
      message: 'Doctor registered successfully. Verification email sent.',
    };
  }

  /**
   * Register hospital admin (by SuperAdmin)
   */
  async registerHospitalAdmin(
    dto: RegisterHospitalAdminDto,
    superAdminUserId: string,
  ): Promise<{ userId: string; message: string }> {
    // Verify super admin
    const superAdmin = await this.userModel.findById(superAdminUserId);
    if (!superAdmin || superAdmin.role !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedException('Only super admins can register hospital admins');
    }

    const existingUser = await this.userModel.findOne({ email: dto.email.toLowerCase() });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpiry = new Date();
    emailVerificationExpiry.setHours(emailVerificationExpiry.getHours() + 24);

    const user = await this.userModel.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      role: UserRole.HOSPITAL_ADMIN,
      fullName: dto.fullName,
      hospitalId: new Types.ObjectId(dto.hospitalId),
      emailVerificationToken,
      emailVerificationExpiry,
      emailVerified: false,
    });

    await this.emailService.sendEmailVerification({
      to: user.email,
      name: dto.fullName,
      verificationToken: emailVerificationToken,
    });

    this.logger.log(`Hospital Admin registered: ${user.email}`);

    return {
      userId: user._id.toString(),
      message: 'Hospital admin registered successfully. Verification email sent.',
    };
  }

  /**
   * Register super admin (restricted - first time setup only)
   */
  async registerSuperAdmin(
    dto: RegisterSuperAdminDto,
    secretKey: string,
  ): Promise<{ userId: string }> {
    // Check super admin secret
    const expectedSecret = this.configService.get<string>('SUPER_ADMIN_SECRET');
    if (!expectedSecret || secretKey !== expectedSecret) {
      throw new UnauthorizedException('Invalid super admin secret key');
    }

    const existingUser = await this.userModel.findOne({ email: dto.email.toLowerCase() });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.userModel.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      fullName: dto.fullName,
      emailVerified: true, // Auto-verify for super admin
    });

    this.logger.log(`Super Admin registered: ${user.email}`);

    return {
      userId: user._id.toString(),
    };
  }

  /**
   * Verify email address
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.userModel.findOne({
      emailVerificationToken: token,
      emailVerificationExpiry: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestException({
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired verification token',
      });
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;
    await user.save();

    // Send welcome email
    await this.emailService.sendWelcomeEmail({
      to: user.email,
      name: user.fullName || 'User',
    });

    this.logger.log(`Email verified: ${user.email}`);

    return { message: 'Email verified successfully. You can now login.' };
  }

  /**
   * Login with email + password
   */
  async login(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthResponseDto> {
    const user = await this.userModel.findOne({
      email: dto.email.toLowerCase(),
      role: dto.role,
    });

    if (!user) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      throw new UnauthorizedException({
        code: 'ACCOUNT_LOCKED',
        message: `Account locked. Try again in ${minutesLeft} minutes.`,
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      // Increment login attempts
      user.loginAttempts += 1;

      if (user.loginAttempts >= this.MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + this.LOCK_TIME);
        await user.save();

        throw new UnauthorizedException({
          code: 'ACCOUNT_LOCKED',
          message: `Too many failed attempts. Account locked for 30 minutes.`,
        });
      }

      await user.save();

      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: `Invalid password. ${this.MAX_LOGIN_ATTEMPTS - user.loginAttempts} attempts remaining.`,
      });
    }

    // Check email verification
    if (!user.emailVerified) {
      throw new UnauthorizedException({
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email before logging in',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException({
        code: 'ACCOUNT_INACTIVE',
        message: 'Your account has been deactivated',
      });
    }

    // Reset login attempts
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLoginAt = new Date();
    await user.save();

    // Generate tokens
    return this.generateAuthResponse(user, ipAddress, userAgent);
  }

  /**
   * Generate auth tokens and response
   */
  private async generateAuthResponse(
    user: UserDocument,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    const permissions = this.getPermissionsForRole(user.role);

    // Create session first
    const refreshTokenValue = crypto.randomBytes(32).toString('hex');
    const refreshExpiry = new Date();
    refreshExpiry.setDate(refreshExpiry.getDate() + 7);

    const sessionId = await this.sessionService.createSession(
      user._id.toString(),
      refreshTokenValue,
      refreshExpiry,
      ipAddress,
      userAgent,
    );

    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      hospitalId: user.hospitalId?.toString(),
      patientId: user.patientId,
      doctorId: user.doctorId?.toString(),
      permissions,
      sessionId,
    };

    const accessToken = this.jwtService.sign(payload as any, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRY', '15m') as any,
    });

    const refreshToken = this.jwtService.sign({ sub: user._id.toString(), sessionId } as any, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRY', '7d') as any,
    });

    this.logger.log(`Login successful: ${user.email} (${user.role})`);

    return {
      accessToken,
      refreshToken: `${sessionId}.${refreshToken}`, // Include sessionId in token
      expiresIn: 900, // 15 minutes in seconds
      role: user.role,
      email: user.email,
      userId: user._id.toString(),
      sessionId,
    };
  }

  /**
   * Get permissions based on role
   */
  private getPermissionsForRole(role: UserRole): string[] {
    const permissionsMap: Record<UserRole, string[]> = {
      [UserRole.PATIENT]: [
        'read:own_profile',
        'update:own_profile',
        'read:own_documents',
        'read:own_encounters',
        'manage:own_consents',
        'download:own_documents',
      ],
      [UserRole.DOCTOR]: [
        'read:patient_data_with_consent',
        'create:encounters',
        'create:documents_with_consent',
        'read:own_profile',
        'update:own_profile',
      ],
      [UserRole.HOSPITAL_ADMIN]: [
        'create:patients',
        'create:doctors',
        'read:hospital_data',
        'upload:documents',
        'read:hospital_audit_logs',
        'manage:hospital_users',
      ],
      [UserRole.SUPER_ADMIN]: [
        'create:hospitals',
        'create:hospital_admins',
        'read:system_audit_logs',
        'manage:global_config',
        'read:all_hospitals',
      ],
    };

    return permissionsMap[role] || [];
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(
    refreshTokenWithSession: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    const [sessionId, refreshToken] = refreshTokenWithSession.split('.');

    if (!sessionId || !refreshToken) {
      throw new UnauthorizedException('Invalid refresh token format');
    }

    // Verify refresh token
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Verify session
    const { valid, session } = await this.sessionService.verifyRefreshToken(
      payload.sub,
      refreshToken,
    );

    if (!valid || !session || session.sessionId !== sessionId) {
      throw new UnauthorizedException('Invalid session');
    }

    // Get user
    const user = await this.userModel.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Generate new tokens with session rotation
    const newRefreshTokenValue = crypto.randomBytes(32).toString('hex');
    const refreshExpiry = new Date();
    refreshExpiry.setDate(refreshExpiry.getDate() + 7);

    const newSessionId = await this.sessionService.rotateRefreshToken(
      sessionId,
      newRefreshTokenValue,
      refreshExpiry,
      ipAddress,
      userAgent,
    );

    const permissions = this.getPermissionsForRole(user.role);

    const newPayload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      hospitalId: user.hospitalId?.toString(),
      patientId: user.patientId,
      doctorId: user.doctorId?.toString(),
      permissions,
      sessionId: newSessionId,
    };

    const accessToken = this.jwtService.sign(newPayload as any, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRY', '15m') as any,
    });

    const newRefreshToken = this.jwtService.sign(
      { sub: user._id.toString(), sessionId: newSessionId } as any,
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRY', '7d') as any,
      },
    );

    return {
      accessToken,
      refreshToken: `${newSessionId}.${newRefreshToken}`,
      expiresIn: 900,
      role: user.role,
      email: user.email,
      userId: user._id.toString(),
      sessionId: newSessionId,
    };
  }

  /**
   * Logout
   */
  async logout(refreshTokenWithSession: string): Promise<{ message: string }> {
    const [sessionId] = refreshTokenWithSession.split('.');

    if (sessionId) {
      await this.sessionService.revokeSession(sessionId);
    }

    return { message: 'Logged out successfully' };
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.userModel.findOne({ email: email.toLowerCase() });

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'If the email exists, a reset link has been sent.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiry = new Date();
    resetExpiry.setHours(resetExpiry.getHours() + 1);

    user.passwordResetToken = resetToken;
    user.passwordResetExpiry = resetExpiry;
    await user.save();

    await this.emailService.sendPasswordReset({
      to: user.email,
      name: user.fullName || 'User',
      resetToken,
    });

    this.logger.log(`Password reset requested: ${email}`);

    return { message: 'If the email exists, a reset link has been sent.' };
  }

  /**
   * Reset password
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.userModel.findOne({
      passwordResetToken: token,
      passwordResetExpiry: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    // Revoke all sessions
    await this.sessionService.revokeAllUserSessions(user._id.toString());

    this.logger.log(`Password reset: ${user.email}`);

    return { message: 'Password reset successfully. Please login with new password.' };
  }

  /**
   * Request OTP for login
   */
  async requestLoginOtp(
    email: string,
    role: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ message: string }> {
    const user = await this.userModel.findOne({
      email: email.toLowerCase(),
      role,
    });

    if (!user) {
      // Don't reveal if email exists
      return { message: 'If the account exists, an OTP has been sent.' };
    }

    if (!user.emailVerified) {
      throw new BadRequestException('Please verify your email first');
    }

    const otp = await this.otpService.createOtp(user.email, OtpPurpose.LOGIN, ipAddress, userAgent);

    await this.emailService.sendOtp(user.email, user.fullName || 'User', otp, 5);

    return { message: 'OTP sent to your email' };
  }

  /**
   * Login with OTP
   */
  async loginWithOtp(
    email: string,
    otp: string,
    role: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    const user = await this.userModel.findOne({
      email: email.toLowerCase(),
      role,
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify OTP
    await this.otpService.verifyOtp(user.email, otp, OtpPurpose.LOGIN);

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    user.lastLoginAt = new Date();
    await user.save();

    return this.generateAuthResponse(user, ipAddress, userAgent);
  }
}
