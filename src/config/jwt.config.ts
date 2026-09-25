import { registerAs } from '@nestjs/config';
import type { ConfigType } from '@nestjs/config';
import type { StringValue } from 'ms';

export const jwtConfig = registerAs('JWT_CONFIG', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET as string,
  refreshSecret: process.env.JWT_REFRESH_SECRET as string,
  accessExpiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ?? '1h') as StringValue,
  refreshExpiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as StringValue,
}));

export type TJwtConfig = ConfigType<typeof jwtConfig>;