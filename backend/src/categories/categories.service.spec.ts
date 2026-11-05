// src/categories/categories.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { IsNull } from 'typeorm';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    remove: jest.Mock;
  };

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
    mockCategory.name = 'Музыка';
    mockCategory.parent = null;
    mockParentCategory.parent = null;
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
    repository = module.get<typeof repository>(getRepositoryToken(Category));
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
      const categoryWithParent = {
        ...mockCategory,
        parent: mockParentCategory,
      };

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
      const categoryWithParent = {
        ...mockCategory,
        parent: mockParentCategory,
      };
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
        .mockResolvedValueOnce(null); // родитель не найден

      const operation = service.update(mockCategory.id, dto);
      await expect(operation).rejects.toThrow(NotFoundException);
      await expect(operation).rejects.toThrow(
        'Родительская категория не найдена',
      );
    });
  });

  describe('защита от циклов', () => {
    const node = (id: string, parent: Category | null = null): Category => ({
      id,
      name: `Категория ${id}`,
      parent,
      children: [],
      skills: [],
    });

    const tree = (nodes: Category[]) => {
      const categories = new Map(
        nodes.map((category) => [category.id, category]),
      );
      repository.findOne.mockImplementation(
        ({ where }: { where: { id: string } }) =>
          Promise.resolve(categories.get(where.id) ?? null),
      );
      repository.save.mockImplementation((category: Category) =>
        Promise.resolve(category),
      );
    };

    it('запрещает назначить категорию родителем самой себе без изменения названия', async () => {
      const category = node('a');
      tree([category]);

      await expect(
        service.update('a', { parentId: 'a', name: 'Не сохранять' }),
      ).rejects.toThrow(BadRequestException);
      expect(category.name).toBe('Категория a');
      expect(category.parent).toBeNull();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('запрещает назначить дочернюю категорию родителем', async () => {
      const root = node('a');
      const child = node('b', root);
      tree([root, child]);

      await expect(service.update('a', { parentId: 'b' })).rejects.toThrow(
        BadRequestException,
      );
      expect(root.parent).toBeNull();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('запрещает вложенный цикл через несколько уровней', async () => {
      const root = node('a');
      const child = node('b', root);
      const grandchild = node('c', child);
      const descendant = node('d', grandchild);
      tree([root, child, grandchild, descendant]);

      await expect(service.update('a', { parentId: 'd' })).rejects.toThrow(
        BadRequestException,
      );
      expect(root.parent).toBeNull();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('останавливает обход, если цепочка нового родителя уже содержит цикл', async () => {
      const category = node('a');
      const parent = node('b');
      const ancestor = node('c', parent);
      parent.parent = ancestor;
      tree([category, parent, ancestor]);

      await expect(service.update('a', { parentId: 'b' })).rejects.toThrow(
        BadRequestException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('разрешает перенести подкатегорию выше без создания цикла', async () => {
      const root = node('a');
      const child = node('b', root);
      const leaf = node('c', child);
      tree([root, child, leaf]);

      const result = await service.update('c', { parentId: 'a' });
      expect(result.parent).toBe(root);
      expect(repository.save).toHaveBeenCalledWith(leaf);
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
