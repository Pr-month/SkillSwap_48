import type { TJwtConfig } from '../../config/jwt.config';
import { UserRole } from '../../users/users.enums';
import { AccessTokenStrategy } from './accessToken.strategy';

describe('AccessTokenStrategy', () => {
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
    expect(new AccessTokenStrategy(config)).toBeDefined();
  });

  it('returns the payload as-is', () => {
    const strategy = new AccessTokenStrategy(config);

    expect(strategy.validate(payload)).toEqual(payload);
  });
});
