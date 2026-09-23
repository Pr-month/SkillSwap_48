import { registerAs } from '@nestjs/config';
import type { ConfigType } from '@nestjs/config';
import type { DataSourceOptions } from 'typeorm';

export const dbConfig = registerAs('DB_CONFIG', (): DataSourceOptions => {
  const databaseMode = process.env.DB_MODE ?? 'local';

  if (databaseMode !== 'local' && databaseMode !== 'supabase') {
    throw new Error(
      'Некорректное значение DB_MODE. Используйте local или supabase.',
    );
  }

  const databaseUrl =
    databaseMode === 'local'
      ? (process.env.LOCAL_DATABASE_URL ??
        'postgresql://postgres:postgres@localhost:5432/skillswap')
      : process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      `Не указана строка подключения для режима ${databaseMode}.`,
    );
  }

  return {
    type: 'postgres',
    url: databaseUrl,

    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],

    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    logging: process.env.DB_LOGGING === 'true',
  };
});

export type TDbConfig = ConfigType<typeof dbConfig>;
