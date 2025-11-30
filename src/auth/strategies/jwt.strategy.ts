import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  hospitalId?: string;
  patientId?: string;
  doctorId?: string;
  permissions: string[];
  sessionId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'fallback-secret',
    });
  }

  async validate(payload: JwtPayload) {
    // Verify user still exists and is active
    const user = await this.userModel.findById(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Return user info to be attached to request
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      hospitalId: payload.hospitalId,
      patientId: payload.patientId,
      doctorId: payload.doctorId,
      permissions: payload.permissions,
      sessionId: payload.sessionId,
    };
  }
}
