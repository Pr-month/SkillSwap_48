import { registerAs } from '@nestjs/config';
import type { ConfigType } from '@nestjs/config';

export const appConfig = registerAs('APP_CONFIG', () => ({
  port: Number(process.env.PORT) || 3000,
  hashSalt: Number(process.env.HASH_SALT) || 10,
  isProduction: process.env.NODE_ENV === 'production',
}));

export type TAppConfig = ConfigType<typeof appConfig>;
