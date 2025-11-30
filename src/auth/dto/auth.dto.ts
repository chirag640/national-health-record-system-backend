import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../schemas/user.schema';

export class RegisterPatientDto {
  @ApiProperty({ example: 'patient@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'SecureP@ssw0rd123' })
  @IsString()
  @MinLength(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password must contain uppercase, lowercase, and number/special character',
  })
  password!: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  fullName!: string;
}

export class RegisterDoctorDto {
  @ApiProperty({ example: 'doctor@hospital.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'VerySecureP@ssw0rd123!' })
  @IsString()
  @MinLength(12)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/, {
    message: 'Password must be 12+ chars with uppercase, lowercase, number, and special character',
  })
  password!: string;

  @ApiProperty({ example: 'Dr. Jane Smith' })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({ example: 'Cardiology' })
  @IsString()
  @IsOptional()
  specialization?: string;

  @ApiProperty({ example: 'MD12345' })
  @IsString()
  @IsOptional()
  licenseNumber?: string;

  @ApiProperty({ example: '+919876543210' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsNotEmpty()
  hospitalId!: string;
}

export class RegisterHospitalAdminDto {
  @ApiProperty({ example: 'admin@hospital.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'VerySecureP@ssw0rd123!' })
  @IsString()
  @MinLength(12)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/, {
    message: 'Password must be 12+ chars with uppercase, lowercase, number, and special character',
  })
  password!: string;

  @ApiProperty({ example: 'Admin Name' })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsNotEmpty()
  hospitalId!: string;
}

export class RegisterSuperAdminDto {
  @ApiProperty({ example: 'superadmin@health.gov.in' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'ExtremelySecureP@ssw0rd123!#' })
  @IsString()
  @MinLength(16)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{16,}$/, {
    message: 'Password must be 16+ chars with uppercase, lowercase, number, and special character',
  })
  password!: string;

  @ApiProperty({ example: 'Super Admin' })
  @IsString()
  @IsNotEmpty()
  fullName!: string;
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.PATIENT })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role!: UserRole;
}

export class LoginWithOtpDto {
  @ApiProperty({ example: 'patient@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.PATIENT })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role!: UserRole;
}

export class VerifyOtpDto {
  @ApiProperty({ example: 'patient@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: '849220' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{6}$/, { message: 'OTP must be 6 digits' })
  otp!: string;

  @ApiProperty({ enum: ['email_verification', 'login', 'mfa', 'password_reset'] })
  @IsString()
  @IsNotEmpty()
  purpose!: string;
}

export class VerifyEmailDto {
  @ApiProperty({ example: 'verification-token-string' })
  @IsString()
  @IsNotEmpty()
  token!: string;
}

export class RefreshTokenDto {
  @ApiProperty({ example: 'refresh-token-string' })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'reset-token-string' })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ example: 'NewSecureP@ssw0rd123' })
  @IsString()
  @MinLength(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password must contain uppercase, lowercase, and number/special character',
  })
  newPassword!: string;
}

export class LogoutDto {
  @ApiProperty({ example: 'refresh-token-string' })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty()
  expiresIn!: number;

  @ApiProperty({ enum: UserRole })
  role!: UserRole;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  sessionId!: string;
}
