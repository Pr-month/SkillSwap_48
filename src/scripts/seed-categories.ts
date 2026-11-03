import 'dotenv/config';
import { AppDataSource } from '../config/ormconfig';
import { Category } from '../categories/entities/category.entity';
import { CategoriesData } from './seed-categories.data';
import { IsNull } from 'typeorm';

async function seedCategories(): Promise<void> {

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const categoryRepository = AppDataSource.getRepository(Category);

  for (const categoryData of CategoriesData) {
    const existingCategory = await categoryRepository.findOne({
      where: { name: categoryData.name, parent: IsNull() },
    });

    if (existingCategory) {
      console.log(`Пропускаем: категория "${categoryData.name}" уже существует.`);
      continue;
    }

    const newCategory = categoryRepository.create({
      name: categoryData.name,
      children: categoryData.children.map((childName) => ({ name: childName })),
    });

    await categoryRepository.save(newCategory);
    console.log(`Добавлена категория: "${categoryData.name}" c ${categoryData.children.length} подкатегориями`);
  }

  console.log('Сидирование категорий успешно завершено.');
  await AppDataSource.destroy();
}

seedCategories().catch((error) => {
  console.error('Ошибка при сидировании категорий:', error);
  process.exit(1);
});