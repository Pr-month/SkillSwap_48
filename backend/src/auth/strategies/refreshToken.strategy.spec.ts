import type { Request } from 'express';
import type { TJwtConfig } from '../../config/jwt.config';
import { UserRole } from '../../users/users.enums';
import { RefreshTokenStrategy } from './refreshToken.strategy';

describe('RefreshTokenStrategy', () => {
  const config: TJwtConfig = {
    accessSecret: 'access-secret',
    refreshSecret: 'refresh-secret',
    accessExpiresIn: '1h',
    refreshExpiresIn: '7d',
  };

  const payload = {
    sub: 'user-id',
    email: 'user@example.com',
    role: UserRole.USER,
  };

  it('should be defined', () => {
    expect(new RefreshTokenStrategy(config)).toBeDefined();
  });

  it('extracts the refresh token from the cookie', () => {
    const strategy = new RefreshTokenStrategy(config);
    const req = {
      cookies: { refreshToken: 'cookie-token' },
      body: {},
    } as unknown as Request;

    expect(strategy.validate(req, payload)).toEqual({
      ...payload,
      refreshToken: 'cookie-token',
    });
  });

  it('returns an empty refresh token when the cookie is missing', () => {
    const strategy = new RefreshTokenStrategy(config);
    const req = { cookies: undefined } as unknown as Request;

    expect(strategy.validate(req, payload)).toEqual({
      ...payload,
      refreshToken: '',
    });
  });
});
