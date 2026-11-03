import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  async create(dto: CreateCategoryDto): Promise<Category> {
    const category = this.categoriesRepository.create({
      name: dto.name,
    });

    if (dto.parentId) {
      const parent = await this.categoriesRepository.findOne({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException('Родительская категория не найдена');
      }
      category.parent = parent;
    }

    return this.categoriesRepository.save(category);
  }

  async findAll(): Promise<Category[]> {
    return this.categoriesRepository.find({
      where: { parent: IsNull() },
      relations: { children: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: { children: true, parent: true },
    });
    if (!category) {
      throw new NotFoundException('Категория не найдена');
    }
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException('Категория не найдена');
    }

    if (dto.parentId !== undefined) {
      if (dto.parentId === null) {
        category.parent = null;
      } else {
        const parent = await this.categoriesRepository.findOne({
          where: { id: dto.parentId },
          relations: { parent: true },
        });
        if (!parent) {
          throw new NotFoundException('Родительская категория не найдена');
        }

        const visited = new Set([category.id]);
        let ancestor: Category | null = parent;
        while (ancestor) {
          if (visited.has(ancestor.id)) {
            throw new BadRequestException(
              'Нельзя назначить категорию или её потомка родителем',
            );
          }
          visited.add(ancestor.id);
          ancestor = ancestor.parent
            ? await this.categoriesRepository.findOne({
                where: { id: ancestor.parent.id },
                relations: { parent: true },
              })
            : null;
        }
        category.parent = parent;
      }
    }

    if (dto.name !== undefined) {
      category.name = dto.name;
    }

    return this.categoriesRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException('Категория не найдена');
    }
    await this.categoriesRepository.remove(category);
  }
}
