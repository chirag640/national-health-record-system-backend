import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { SessionService } from './session.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ConsentGuard } from './guards/consent.guard';
import { User, UserSchema } from './schemas/user.schema';
import { Otp, OtpSchema } from './schemas/otp.schema';
import { Session, SessionSchema } from './schemas/session.schema';
import { EmailModule } from '../email/email.module';
import { Doctor, DoctorSchema } from '../modules/doctor/schemas/doctor.schema';
import { Consent, ConsentSchema } from '../modules/consent/schemas/consent.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Otp.name, schema: OtpSchema },
      { name: Session.name, schema: SessionSchema },
      { name: Doctor.name, schema: DoctorSchema },
      { name: Consent.name, schema: ConsentSchema },
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'fallback-secret',
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_EXPIRY', '15m') as any,
        },
      }),
    }),
    EmailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, OtpService, SessionService, JwtStrategy, ConsentGuard],
  exports: [
    AuthService,
    OtpService,
    SessionService,
    JwtStrategy,
    ConsentGuard,
    PassportModule,
    JwtModule,
  ],
})
export class AuthModule {}
