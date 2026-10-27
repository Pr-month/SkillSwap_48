import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import type { DataSource } from 'typeorm';

import { AppDataSource } from '../config/ormconfig';
import { User } from '../users/entities/user.entity';
import { testUsers } from './data/seed-users.data';

export async function seedUsers(
  dataSource: DataSource = AppDataSource,
): Promise<void> {
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }

  const usersRepository = dataSource.getRepository(User);
  const saltRounds = Number(process.env.HASH_SALT) || 10;

  const users = await Promise.all(
    testUsers.map(async (userData) => {
      const passwordHash = await bcrypt.hash(userData.password, saltRounds);

      return usersRepository.create({
        ...userData,
        email: userData.email.toLowerCase(),
        password: passwordHash,
      });
    }),
  );

  await usersRepository
    .createQueryBuilder()
    .insert()
    .into(User)
    .values(users)
    .orIgnore()
    .execute();

  console.log('Сидинг тестовых пользователей успешно завершён');
}

async function runSeedUsers(): Promise<void> {
  try {
    await seedUsers();
  } catch (error: unknown) {
    console.error('Ошибка сидинга тестовых пользователей:', error);
    process.exitCode = 1;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

if (require.main === module) {
  void runSeedUsers();
}
