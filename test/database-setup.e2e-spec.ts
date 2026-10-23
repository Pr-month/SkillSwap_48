import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { City } from '../src/cities/entities/city.entity';
import { Skill } from '../src/skills/entities/skill.entity';
import { testSkills } from '../src/scripts/data/seed-skills.data';
import { testUsers } from '../src/scripts/data/seed-users.data';
import { User } from '../src/users/entities/user.entity';
import { UserRole } from '../src/users/users.enums';
import { createTestApp } from './test-app';

describe('Database preparation (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  beforeAll(async () => {
    app = await createTestApp();
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await app?.close();
  });

  it('connects the application to the separate test database', async () => {
    const [database] = await dataSource.query<{ name: string }[]>(
      'SELECT current_database() AS name',
    );

    expect(database.name).toBe('test');
  });

  it('has seeded users and an administrator before tests begin', async () => {
    const usersRepository = dataSource.getRepository(User);

    for (const fixture of testUsers) {
      const user = await usersRepository.findOneBy({ email: fixture.email });
      expect(user).toMatchObject({ name: fixture.name, role: fixture.role });
      expect(user?.password).not.toBe(fixture.password);
    }

    const email = (process.env.ADMIN_EMAIL ?? 'admin@admin.com').toLowerCase();
    const admin = await usersRepository.findOneBy({ email });
    expect(admin?.role).toBe(UserRole.ADMIN);
  });

  it('has cities needed by the seeded users', async () => {
    const citiesRepository = dataSource.getRepository(City);

    for (const fixture of testUsers) {
      const city = await citiesRepository.findOneBy({ name: fixture.city });
      expect(city).not.toBeNull();
    }
  });

  it('has skills with the correct owners and category hierarchy', async () => {
    const skillsRepository = dataSource.getRepository(Skill);

    for (const fixture of testSkills) {
      const skill = await skillsRepository.findOne({
        where: { title: fixture.title, owner: { email: fixture.ownerEmail } },
        relations: { owner: true, category: { parent: true } },
      });

      expect(skill?.owner.email).toBe(fixture.ownerEmail);
      expect(skill?.category.name).toBe(fixture.subcategoryName);
      expect(skill?.category.parent?.name).toBe(fixture.categoryName);
    }
  });
});
