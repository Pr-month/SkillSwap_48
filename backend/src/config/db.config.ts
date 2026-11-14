import { registerAs } from '@nestjs/config';
import type { ConfigType } from '@nestjs/config';
import type { DataSourceOptions } from 'typeorm';

type TConnection =
  | { url: string }
  | {
      host: string;
      port: number;
      username: string;
      password: string;
      database: string;
    };

export const dbConfig = registerAs('DB_CONFIG', (): DataSourceOptions => {
  const databaseMode = process.env.DB_MODE ?? 'local';

  if (databaseMode !== 'local' && databaseMode !== 'supabase') {
    throw new Error(
      'Некорректное значение DB_MODE. Используйте local или supabase.',
    );
  }

  let connection: TConnection;

  if (databaseMode === 'local' && process.env.DB_HOST) {
    // Отдельные параметры: пароль со спецсимволами не нужно URL-кодировать
    connection = {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASSWORD ?? '',
      database: process.env.DB_NAME ?? 'skillswap',
    };
  } else {
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

    connection = { url: databaseUrl };
  }

  return {
    type: 'postgres',
    ...connection,

    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],

    synchronize: false,
    migrationsRun: false,
    migrationsTableName: 'migrations',
    logging: process.env.DB_LOGGING === 'true',
  };
});

export type TDbConfig = ConfigType<typeof dbConfig>;
