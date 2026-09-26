import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { REFRESH_TOKEN_COOKIE } from '../auth.constants';
import { jwtConfig } from '../../config/jwt.config';
import type { TJwtConfig } from '../../config/jwt.config';
import type { JwtPayload, RefreshTokenPayload } from '../auth.types';

function extractRefreshToken(req: Request): string | null {
  const { cookies } = req as unknown as {
    cookies?: Record<string, string>;
  };

  return cookies?.[REFRESH_TOKEN_COOKIE] ?? null;
}

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'refreshToken',
) {
  constructor(config: ConfigService) {
    const jwt = config.getOrThrow<TJwtConfig>(jwtConfig.KEY);

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => extractRefreshToken(req),
      ]),
      ignoreExpiration: false,
      secretOrKey: jwt.refreshSecret,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: JwtPayload): RefreshTokenPayload {
    const refreshToken = extractRefreshToken(req) ?? '';

    return { ...payload, refreshToken };
  }
}
