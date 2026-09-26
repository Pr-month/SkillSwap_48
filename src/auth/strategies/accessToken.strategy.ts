import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConfig } from '../../config/jwt.config';
import type { TJwtConfig } from '../../config/jwt.config';
import { JwtPayload } from '../auth.types';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(
  Strategy,
  'accessToken',
) {
  constructor(config: ConfigService) {
    const jwt = config.getOrThrow<TJwtConfig>(jwtConfig.KEY);

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwt.accessSecret,
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    return payload;
  }
}
