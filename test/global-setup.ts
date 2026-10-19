import './setup-env';
import { DataSource } from 'typeorm';
import { dbConfig } from '../src/config/db.config';
import { seedAdmin } from '../src/scripts/seed-admin';
import { seedCities } from '../src/scripts/seed-cities';
import { seedSkills } from '../src/scripts/seed-skills';
import { seedUsers } from '../src/scripts/seed-users';

export default async function prepareTestDatabase(): Promise<void> {
  const options = dbConfig();

  if (
    process.env.NODE_ENV !== 'test' ||
    options.type !== 'postgres' ||
    !options.url
  ) {
    throw new Error(
      'Подготовка E2E разрешена только для тестовой PostgreSQL-базы test.',
    );
  }

  let databaseUrl: URL;

  try {
    databaseUrl = new URL(options.url);
  } catch {
    throw new Error('Некорректный URL тестовой базы данных.');
  }

  if (
    !['postgres:', 'postgresql:'].includes(databaseUrl.protocol) ||
    databaseUrl.pathname !== '/test'
  ) {
    throw new Error(
      'Настройте подключение к отдельной базе test перед запуском E2E.',
    );
  }

  const dataSource = new DataSource({
    ...options,
    synchronize: false,
    migrationsRun: false,
    dropSchema: false,
  });

  await dataSource.initialize();

  try {
    const [database] = await dataSource.query<{ name: string }[]>(
      'SELECT current_database() AS name',
    );

    if (database?.name !== 'test') {
      throw new Error('Очистка отменена: фактическая база данных не test.');
    }

    const tables = await dataSource.query<{ name: string }[]>(
      `SELECT format('%I.%I', schemaname, tablename) AS name
       FROM pg_tables
       WHERE schemaname = 'public'
         AND tablename NOT IN ('migrations', 'typeorm_metadata')`,
    );

    if (tables.length > 0) {
      await dataSource.query(
        `TRUNCATE TABLE ${tables.map((table) => table.name).join(', ')} RESTART IDENTITY CASCADE`,
      );
    }

    if (options.synchronize) {
      await dataSource.synchronize();
    }

    await seedCities(dataSource);
    await seedAdmin(dataSource);
    await seedUsers(dataSource);
    await seedSkills(dataSource);
    console.log('База test очищена и заполнена перед E2E-тестами.');
  } finally {
    await dataSource.destroy();
  }
}
