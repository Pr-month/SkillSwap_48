import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { jwtConfig } from '../../config/jwt.config';
import type { TJwtConfig } from '../../config/jwt.config';
import { JwtPayload } from '../auth.types';

export type RefreshTokenPayload = JwtPayload & { refreshToken: string };

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'refreshToken',
) {
  constructor(config: ConfigService) {
    const jwt = config.getOrThrow<TJwtConfig>(jwtConfig.KEY);

    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: jwt.refreshSecret,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: JwtPayload): RefreshTokenPayload {
    const { refreshToken } = req.body as { refreshToken: string };

    return { ...payload, refreshToken };
  }
}
