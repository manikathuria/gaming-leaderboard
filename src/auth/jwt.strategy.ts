import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(cfg: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: cfg.get('JWT_SECRET') || process.env.JWT_SECRET || 'devsecret',
    });
  }

  async validate(payload: any) {
    // payload.sub and payload.username
    console.log(`payload: ${JSON.stringify(payload)}`);
    return { userId: payload.sub, username: payload.username };
  }
}
