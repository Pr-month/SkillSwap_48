import 'dotenv/config';
import { DataSource } from 'typeorm';

const databaseMode = process.env.DB_MODE ?? 'local';

if (databaseMode !== 'local' && databaseMode !== 'supabase') {
  throw new Error(
    'Некорректное значение DB_MODE. Используйте local или supabase.',
  );
}

const databaseUrl =
  databaseMode === 'local'
    ? process.env.LOCAL_DATABASE_URL
    : process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(`Не указана строка подключения для режима ${databaseMode}.`);
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,

  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],

  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  logging: process.env.DB_LOGGING === 'true',
});
