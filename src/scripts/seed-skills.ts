import { DataSource, IsNull } from 'typeorm';
import { AppDataSource } from '../config/ormconfig';
import { Category } from '../categories/entities/category.entity';
import { Skill } from '../skills/entities/skill.entity';
import { User } from '../users/entities/user.entity';
import { testSkills } from './data/seed-skills.data';
import { seedUsers } from './seed-users';

export interface SkillsSeedResult {
  created: number;
  skipped: number;
}

export async function seedSkills(
  dataSource: DataSource,
): Promise<SkillsSeedResult> {
  return dataSource.transaction(async (manager) => {
    const usersRepository = manager.getRepository(User);
    const categoriesRepository = manager.getRepository(Category);
    const skillsRepository = manager.getRepository(Skill);
    const categories = new Map<string, Category>();

    async function findOrCreateCategory(
      name: string,
      parent: Category | null,
    ): Promise<Category> {
      const key = `${parent?.id ?? 'root'}:${name}`;
      let category = categories.get(key);

      if (!category) {
        category =
          (await categoriesRepository.findOneBy({
            name,
            parent: parent ? { id: parent.id } : IsNull(),
          })) ??
          (await categoriesRepository.save(
            categoriesRepository.create({ name, parent }),
          ));
        categories.set(key, category);
      }

      return category;
    }
    const result: SkillsSeedResult = { created: 0, skipped: 0 };

    for (const skillData of testSkills) {
      const owner = await usersRepository.findOneBy({
        email: skillData.ownerEmail.toLowerCase(),
      });

      if (!owner) {
        throw new Error(
          `Не найден сидинговый пользователь ${skillData.ownerEmail}. Сначала запустите сидинг пользователей.`,
        );
      }

      const existingSkill = await skillsRepository.findOneBy({
        title: skillData.title,
        owner: { id: owner.id },
      });

      if (existingSkill) {
        result.skipped += 1;
        continue;
      }

      const parentCategory = await findOrCreateCategory(
        skillData.categoryName,
        null,
      );
      const category = await findOrCreateCategory(
        skillData.subcategoryName,
        parentCategory,
      );

      await skillsRepository.save(
        skillsRepository.create({
          title: skillData.title,
          description: skillData.description,
          images: skillData.images,
          owner,
          category,
        }),
      );
      result.created += 1;
    }

    return result;
  });
}

async function runSeedSkills(): Promise<void> {
  try {
    const options = AppDataSource.options;

    if (
      process.env.NODE_ENV !== 'test' ||
      options.type !== 'postgres' ||
      !options.url ||
      new URL(options.url).pathname !== '/test'
    ) {
      throw new Error(
        'Для команды seed:test:skills настройте базу test в .env.test.local.',
      );
    }

    await AppDataSource.initialize();
    const [database] = await AppDataSource.query<{ name: string }[]>(
      'SELECT current_database() AS name',
    );

    if (database?.name !== 'test') {
      throw new Error('Сидинг отменён: подключение ведёт не к базе test.');
    }

    await seedUsers(AppDataSource);
    const result = await seedSkills(AppDataSource);
    console.log(
      `Сидинг навыков завершён: добавлено ${result.created}, уже существовало ${result.skipped}.`,
    );
  } catch (error: unknown) {
    console.error(
      'Ошибка сидинга навыков:',
      error instanceof Error ? error.message : 'Неизвестная ошибка',
    );
    process.exitCode = 1;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

if (require.main === module) {
  void runSeedSkills();
}
