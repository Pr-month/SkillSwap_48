// src/categories/categories.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { IsNull, Repository } from 'typeorm';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repository: jest.Mocked<Repository<Category>>;

  // Мок категории для тестов
  const mockCategory = {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: 'Музыка',
    parent: null,
    children: [],
    skills: [],
  } as unknown as Category;

  const mockParentCategory = {
    id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    name: 'Искусство',
    parent: null,
    children: [],
    skills: [],
  } as unknown as Category;

  beforeEach(async () => {
    // Создаём мок репозитория
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getRepositoryToken(Category),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    repository = module.get(getRepositoryToken(Category));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ========== create ==========
  describe('create', () => {
    it('должен создать категорию без родителя', async () => {
      const dto: CreateCategoryDto = { name: 'Музыка' };
      repository.create.mockReturnValue(mockCategory);
      repository.save.mockResolvedValue(mockCategory);

      const result = await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith({ name: 'Музыка' });
      expect(repository.findOne).not.toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalledWith(mockCategory);
      expect(result).toEqual(mockCategory);
    });

    it('должен создать категорию с родителем', async () => {
      const dto: CreateCategoryDto = {
        name: 'Музыка',
        parentId: mockParentCategory.id,
      };
      const categoryWithParent = { ...mockCategory, parent: mockParentCategory };

      repository.create.mockReturnValue(mockCategory);
      repository.findOne.mockResolvedValue(mockParentCategory);
      repository.save.mockResolvedValue(categoryWithParent);

      const result = await service.create(dto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: mockParentCategory.id },
      });
      expect(repository.save).toHaveBeenCalledWith(categoryWithParent);
      expect(result).toEqual(categoryWithParent);
    });

    it('должен выбросить NotFoundException, если родитель не найден', async () => {
      const dto: CreateCategoryDto = {
        name: 'Музыка',
        parentId: 'non-existent-id',
      };
      repository.create.mockReturnValue(mockCategory);
      repository.findOne.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      await expect(service.create(dto)).rejects.toThrow(
        'Родительская категория не найдена',
      );
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  // ========== findAll ==========
  describe('findAll', () => {
    it('должен вернуть список корневых категорий с детьми', async () => {
      const categories = [mockCategory, mockParentCategory];
      repository.find.mockResolvedValue(categories);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        where: { parent: IsNull() },
        relations: { children: true },
        order: { name: 'ASC' },
      });
      expect(result).toEqual(categories);
    });
  });

  // ========== findOne ==========
  describe('findOne', () => {
    it('должен вернуть категорию по ID', async () => {
      repository.findOne.mockResolvedValue(mockCategory);

      const result = await service.findOne(mockCategory.id);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: mockCategory.id },
        relations: { children: true, parent: true },
      });
      expect(result).toEqual(mockCategory);
    });

    it('должен выбросить NotFoundException, если категория не найдена', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        'Категория не найдена',
      );
    });
  });

  // ========== update ==========
describe('update', () => {
  it('должен обновить название категории', async () => {
    const dto: UpdateCategoryDto = { name: 'Новое название' };
    const updatedCategory = { ...mockCategory, name: 'Новое название' };

    repository.findOne.mockResolvedValue(mockCategory);
    repository.save.mockResolvedValue(updatedCategory);

    const result = await service.update(mockCategory.id, dto);

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id: mockCategory.id },
    });
    expect(repository.save).toHaveBeenCalledWith(updatedCategory);
    expect(result).toEqual(updatedCategory);
  });

  it('должен установить parent в null при parentId = null', async () => {
    const dto: UpdateCategoryDto = { parentId: null };
    const categoryWithParent = { ...mockCategory, parent: mockParentCategory };
    const updatedCategory = { ...categoryWithParent, parent: null };

    repository.findOne.mockResolvedValue(categoryWithParent);
    repository.save.mockResolvedValue(updatedCategory);

    const result = await service.update(mockCategory.id, dto);

    expect(repository.save).toHaveBeenCalledWith(updatedCategory);
    expect(result).toEqual(updatedCategory);
  });

  it('должен установить нового родителя при parentId', async () => {
    const dto: UpdateCategoryDto = { parentId: mockParentCategory.id };
    const updatedCategory = { ...mockCategory, parent: mockParentCategory };

    repository.findOne
      .mockResolvedValueOnce(mockCategory) // поиск категории
      .mockResolvedValueOnce(mockParentCategory); // поиск родителя
    repository.save.mockResolvedValue(updatedCategory);

    const result = await service.update(mockCategory.id, dto);

    expect(repository.findOne).toHaveBeenCalledTimes(2);
    expect(repository.save).toHaveBeenCalledWith(updatedCategory);
    expect(result).toEqual(updatedCategory);
  });

  it('должен выбросить NotFoundException, если категория не найдена', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(
      service.update('non-existent-id', { name: 'Новое' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('должен выбросить NotFoundException, если новый родитель не найден', async () => {
    const dto: UpdateCategoryDto = { parentId: 'non-existent-parent' };

    repository.findOne
      .mockResolvedValueOnce(mockCategory) // категория найдена
      .mockResolvedValueOnce(null);        // родитель не найден

    try {
      await service.update(mockCategory.id, dto);
      fail('Ожидалась ошибка NotFoundException');
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException);
      expect((error as NotFoundException).message).toBe(
        'Родительская категория не найдена',
      );
    }
  });
});

  // ========== remove ==========
  describe('remove', () => {
    it('должен удалить категорию', async () => {
      repository.findOne.mockResolvedValue(mockCategory);
      repository.remove.mockResolvedValue(mockCategory);

      await service.remove(mockCategory.id);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: mockCategory.id },
      });
      expect(repository.remove).toHaveBeenCalledWith(mockCategory);
    });

    it('должен выбросить NotFoundException, если категория не найдена', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.remove('non-existent-id')).rejects.toThrow(
        'Категория не найдена',
      );
      expect(repository.remove).not.toHaveBeenCalled();
    });
  });
});