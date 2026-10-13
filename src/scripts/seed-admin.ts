import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { AppDataSource } from '../config/ormconfig';
import { User } from '../users/entities/user.entity';
import { Gender, UserRole } from '../users/users.enums';

async function seedAdmin(): Promise<void> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const usersRepository = AppDataSource.getRepository(User);

  const email = (process.env.ADMIN_EMAIL ?? 'admin@admin.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? 'admin1234';
  const saltRounds = Number(process.env.HASH_SALT) || 10;

  const existingAdmin = await usersRepository.findOne({ where: { email } });
  if (existingAdmin) {
    console.log('Сидинг администратора пропущен');
    return;
  }

  const passwordHash = await bcrypt.hash(password, saltRounds);

  const admin = usersRepository.create({
    name: 'Администратор',
    email,
    password: passwordHash,
    about: '',
    birthdate: '1990-01-01',
    city: 'Москва',
    gender: Gender.OTHER,
    avatar: '',
    role: UserRole.ADMIN,
    refreshToken: null,
  });

  await usersRepository.save(admin);

  console.log('Сидинг администратора успешно завершен');
}

void seedAdmin()
  .catch((error) => console.error(`Ошибка сидинга администратора: ${error}`))
  .finally(() => {
    if (AppDataSource.isInitialized) {
      void AppDataSource.destroy();
    }
  });
